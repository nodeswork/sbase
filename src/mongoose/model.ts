import 'reflect-metadata';

import * as _ from 'underscore';
import debug from 'debug';
import {
  Document,
  DocumentToObjectOptions,
  Model as MModel,
  Mongoose,
  Query,
  Schema,
  SchemaOptions,
  SchemaTypes,
} from 'mongoose';
import { MongoError } from 'mongodb';

import { A7ModelType } from './a7-model';
import { AsObject } from '../../mongoose';
import { ConvertModel } from './types';
import { extendMetadata, pushMetadata } from './helpers';
import { sbaseMongooseConfig } from './model-config';

const d = debug('sbase:model');

export type ModelType = typeof Model;
export type IModel<E extends DocumentModel> = MModel<E>;

export interface Model {
  toJSON(options?: DocumentToObjectOptions): AsObject<this>;
}

/**
 * Wrapped Model from mongoose.Model.
 */
export class Model {
  public static Schema(schema: Schema): ModelType {
    extendMetadata(SCHEMA_KEY, this.prototype, schema);
    return this;
  }

  public static Config(config: SchemaOptions): ModelType {
    extendMetadata(CONFIG_KEY, this.prototype, config);
    return this;
  }

  public static Pre(pre: Pre): ModelType {
    pushMetadata(PRE_KEY, this.prototype, pre);
    return this;
  }

  public static Post(post: Post): ModelType {
    pushMetadata(POST_KEY, this.prototype, post);
    return this;
  }

  public static Virtual(virtual: Virtual): ModelType {
    pushMetadata(VIRTUAL_KEY, this.prototype, virtual);
    return this;
  }

  public static Plugin(plugin: Plugin): ModelType {
    pushMetadata(PLUGIN_KEY, this.prototype, plugin);
    return this;
  }

  public static Index(index: Index): ModelType {
    pushMetadata(INDEX_KEY, this.prototype, index);
    return this;
  }

  public static Mixin(model: ModelType): ModelType {
    pushMetadata(MIXIN_KEY, this.prototype, model);
    return this;
  }

  public static UpdateValidator(validate: UpdateValidator): ModelType {
    pushMetadata(UPDATE_VALIDATOR_KEY, this.prototype, validate);
    return this;
  }

  public static $mongooseOptions(tenancy: string = 'default'): MongooseOptions {
    if (this === Model) {
      return null;
    }

    d('generate $mongooseOptions for %O', this.name);

    let mongooseOptionsMap: MongooseOptionsMap = Reflect.getOwnMetadata(
      MONGOOSE_OPTIONS_KEY,
      this.prototype,
    );

    if (mongooseOptionsMap && mongooseOptionsMap[tenancy]) {
      return mongooseOptionsMap[tenancy];
    }

    const mongooseOptions: MongooseOptions = {};

    mongooseOptionsMap = {
      [tenancy]: mongooseOptions,
    };

    Reflect.defineMetadata(
      MONGOOSE_OPTIONS_KEY,
      mongooseOptionsMap,
      this.prototype,
    );

    const superClass: ModelType = (this as any).__proto__;

    const superOptions: MongooseOptions =
      superClass.$mongooseOptions(tenancy) || {};

    const mixinModels: ModelType[] = _.union(
      Reflect.getOwnMetadata(MIXIN_KEY, this.prototype) || [],
    );
    const mixinOptions = _.map(mixinModels, (model) =>
      model.$mongooseOptions(tenancy),
    );

    const schemas = _.flatten([
      _.map(mixinOptions, (opt) => opt.schema),
      superOptions.schema,
      Reflect.getOwnMetadata(SCHEMA_KEY, this.prototype),
    ]);
    mongooseOptions.schema = _.extend({}, ...schemas);

    const configs = _.flatten([
      _.map(mixinOptions, (opt) => opt.config),
      superOptions.config,
      Reflect.getOwnMetadata(CONFIG_KEY, this.prototype),
    ]);
    mongooseOptions.config = _.extend({}, ...configs);

    mongooseOptions.pres = _.filter(
      _.union(
        _.flatten([
          _.map(mixinOptions, (opt) => opt.pres),
          superOptions.pres,
          Reflect.getOwnMetadata(PRE_KEY, this.prototype),
        ]),
      ),
      (x) => !!x,
    );

    mongooseOptions.posts = _.filter(
      _.union(
        _.flatten([
          _.map(mixinOptions, (opt) => opt.posts),
          superOptions.posts,
          Reflect.getOwnMetadata(POST_KEY, this.prototype),
        ]),
      ),
      (x) => !!x,
    );

    mongooseOptions.virtuals = _.filter(
      _.union(
        _.flatten([
          _.map(mixinOptions, (opt) => opt.virtuals),
          superOptions.virtuals,
          Reflect.getOwnMetadata(VIRTUAL_KEY, this.prototype),
        ]),
      ),
      (x) => !!x,
    );

    mongooseOptions.updateValidators = _.filter(
      _.union(
        _.flatten([
          _.map(mixinOptions, (opt) => opt.updateValidators),
          superOptions.updateValidators,
          Reflect.getOwnMetadata(UPDATE_VALIDATOR_KEY, this.prototype),
        ]),
      ),
      (x) => !!x,
    );

    mongooseOptions.plugins = _.sortBy(
      _.filter(
        _.union(
          _.flatten([
            _.map(mixinOptions, (opt) => opt.plugins),
            superOptions.plugins,
            Reflect.getOwnMetadata(PLUGIN_KEY, this.prototype),
          ]),
        ),
        (x) => !!x,
      ),
      (plugin) => plugin.priority,
    );

    mongooseOptions.indexes = _.filter(
      _.union(
        _.flatten([
          _.map(mixinOptions, (opt) => opt.indexes),
          superOptions.indexes,
          Reflect.getOwnMetadata(INDEX_KEY, this.prototype),
        ]),
      ),
      (x) => !!x,
    );

    mongooseOptions.methods = _.filter(
      _.union(
        _.flatten([
          _.map(mixinOptions, (opt) => opt.methods),
          superOptions.methods,
        ]),
      ),
      (x) => !!x,
    );

    mongooseOptions.statics = _.filter(
      _.union(
        _.flatten([
          _.map(mixinOptions, (opt) => opt.statics),
          superOptions.statics,
        ]),
      ),
      (x) => !!x,
    );

    for (const name of Object.getOwnPropertyNames(this.prototype)) {
      if (name === 'constructor') {
        continue;
      }

      const descriptor = Object.getOwnPropertyDescriptor(this.prototype, name);

      if (descriptor.value && _.isFunction(descriptor.value)) {
        mongooseOptions.methods.push({ name, fn: descriptor.value });
      }

      if (descriptor.get || descriptor.set) {
        mongooseOptions.virtuals.push({
          name,
          get: descriptor.get,
          set: descriptor.set,
        });
      }
    }

    for (const name of Object.getOwnPropertyNames(this)) {
      const descriptor = Object.getOwnPropertyDescriptor(this, name);

      if (STATIC_FILTER_NAMES.indexOf(name) >= 0) {
        continue;
      }

      if (descriptor.value) {
        mongooseOptions.statics.push({ name, fn: descriptor.value });
      }
    }

    const collection = _.chain([
      tenancy === 'default'
        ? sbaseMongooseConfig.multiTenancy.defaultCollectionNamespace
        : tenancy,
      mongooseOptions.config.collection,
    ])
      .filter((x) => !!x)
      .join('.')
      .value();

    const mongooseSchema = new Schema(
      mongooseOptions.schema,
      _.extend(_.clone(mongooseOptions.config), { collection }),
    );

    (mongooseSchema as any).parentSchema = superOptions.mongooseSchema;

    for (const pre of mongooseOptions.pres) {
      d(
        'create pre for %O with name %O and options %O',
        this.name,
        pre.name,
        pre,
      );
      pre.parallel = pre.parallel || false;
      mongooseSchema.pre(pre.name, pre.parallel, pre.fn, pre.errorCb);
    }

    for (const post of mongooseOptions.posts) {
      d(
        'create post for %O with name %O and options %O',
        this.name,
        post.name,
        post,
      );
      (mongooseSchema as any).post(post.name, post.fn);
    }

    for (const virtual of mongooseOptions.virtuals) {
      d(
        'create virtual for %O with name %O and options %O',
        this.name,
        virtual.name,
        virtual.options,
      );
      let v = mongooseSchema.virtual(virtual.name, virtual.options);
      if (virtual.get) {
        v = v.get(virtual.get);
      }
      if (virtual.set) {
        v = v.set(virtual.set);
      }
    }

    for (const method of mongooseOptions.methods) {
      d(
        'create method for %O with name %O and function %O',
        this.name,
        method.name,
        method.fn,
      );
      mongooseSchema.methods[method.name] = method.fn;
    }

    for (const method of mongooseOptions.statics) {
      mongooseSchema.statics[method.name] = method.fn;
    }

    for (const plugin of mongooseOptions.plugins) {
      const options = _.extend({}, mongooseOptions.config, plugin.options);
      mongooseSchema.plugin(plugin.fn, options);
    }

    for (const index of mongooseOptions.indexes) {
      d(
        'create index for %O with fields %O and options %O',
        this.name,
        index.fields,
        index.options,
      );
      mongooseSchema.index(index.fields, index.options);
    }

    for (const validate of mongooseOptions.updateValidators) {
      mongooseSchema
        .path(validate.path)
        .validate(
          combineValidator(validate.fn),
          validate.errorMsg,
          validate.type,
        );
    }

    mongooseOptions.mongooseSchema = mongooseSchema;
    return mongooseOptions;
  }

  public static $register<T extends ModelType>(
    this: T,
    mongooseInstance?: Mongoose,
  ): ConvertModel<InstanceType<T> & Document, InstanceType<T>> & T {
    if (!mongooseInstance) {
      mongooseInstance = require('mongoose');
    }
    return registerMultiTenancy(mongooseInstance, this) as any;
  }

  public static $registerA7Model<T extends ModelType>(
    this: T,
    mongooseInstance?: Mongoose,
  ): ConvertModel<InstanceType<T> & Document, InstanceType<T>> &
    T &
    A7ModelType {
    if (!mongooseInstance) {
      mongooseInstance = require('mongoose');
    }
    return registerMultiTenancy(mongooseInstance, this) as any;
  }
}

const mongooseInstanceMap: {
  [tenancy: string]: Mongoose;
} = {};

export const lazyFns: string[] = [];

export const shareFns = ['on'];

function registerMultiTenancy<T extends ModelType>(
  mongooseInstance: Mongoose,
  model: T,
): MModel<Document> & T {
  if (!sbaseMongooseConfig.multiTenancy.enabled) {
    return mongooseInstance.model(
      model.name,
      model.$mongooseOptions().mongooseSchema,
    ) as any;
  }

  const tenants = ['default'].concat(sbaseMongooseConfig.multiTenancy.tenants);
  const tenantMap: {
    [key: string]: MModel<Document> & T;
  } = {};

  for (const tenancy of tenants) {
    let mi = mongooseInstanceMap[tenancy];

    if (mi == null) {
      mi = new Mongoose();
      mi.connect(
        sbaseMongooseConfig.multiTenancy.uris,
        sbaseMongooseConfig.multiTenancy.options,
        (err) => {
          sbaseMongooseConfig.multiTenancy.onError(err, tenancy);
        },
      );
      sbaseMongooseConfig.multiTenancy.onMongooseInstanceCreated(mi, tenancy);
      mongooseInstanceMap[tenancy] = mi;
    }

    const m = mi.model(
      model.name,
      model.$mongooseOptions(tenancy).mongooseSchema,
    ) as any;
    tenantMap[tenancy] = m;
  }

  const proxy: any = new Proxy<MModel<Document> & T>({} as any, {
    get: (_obj: {}, prop: string) => {
      if (prop === '$tenantMap') {
        return tenantMap;
      }

      if (lazyFns.indexOf(prop) >= 0) {
        const ret = function () {
          const t = sbaseMongooseConfig.multiTenancy.tenancyFn(prop);
          const m1: any = tenantMap[t];
          const actualFn = m1[prop];

          return actualFn.apply(this, arguments);
        };
        return ret;
      }

      if (shareFns.indexOf(prop) >= 0) {
        const ret = () => {
          return _.map(tenants, (t) => {
            const m2: any = tenantMap[t];
            return m2[prop].apply(m2, arguments);
          });
        };
        return ret;
      }

      const tenancy = sbaseMongooseConfig.multiTenancy.tenancyFn(prop);
      const m: any = tenantMap[tenancy];
      m._proxy = proxy;

      if (prop === '$modelClass') {
        return m;
      }

      const res = m[prop];
      return _.isFunction(res) ? res.bind(m) : res;
    },
    set: (_obj: {}, prop: string, value: any) => {
      const tenancy = sbaseMongooseConfig.multiTenancy.tenancyFn(prop);
      const m: any = tenantMap[tenancy];
      m[prop] = value;
      return true;
    },
  });

  return proxy;
}

export interface DocumentModel extends Document {}

export class DocumentModel extends Model {
  public static cast<D extends DocumentModel>(): IModel<D> {
    return (this as any)._proxy || this;
  }
}

const SCHEMA_KEY = Symbol('sbase:schema');
const CONFIG_KEY = Symbol('sbase:config');
const PRE_KEY = Symbol('sbase:pre');
const POST_KEY = Symbol('sbase:post');
const VIRTUAL_KEY = Symbol('sbase:virtual');
const PLUGIN_KEY = Symbol('sbase:plugin');
const INDEX_KEY = Symbol('sbase:index');
const UPDATE_VALIDATOR_KEY = Symbol('sbase:updateValidator');
const MIXIN_KEY = Symbol('sbase:mixin');
const MONGOOSE_OPTIONS_KEY = Symbol('sbase:mongooseOptions');

export function Enum(e: any, schema: any = {}) {
  return Field(
    _.extend({}, schema, {
      type: String,
      enum: Object.values(e).concat([null]),
    }),
  );
}

export function DBRef(ref: string, schema: any = {}) {
  return Field(
    _.extend({}, schema, {
      type: SchemaTypes.ObjectId,
      ref,
    }),
  );
}

export function DBRefArray(ref: string, schema: any = {}) {
  return Field(
    _.extend({}, schema, {
      type: [
        {
          type: SchemaTypes.ObjectId,
          ref,
        },
      ],
    }),
  );
}

export function ArrayField(type: any, schema: any = {}) {
  return Field(
    _.extend({}, schema, {
      type: [type],
      default: [],
    }),
  );
}

export function Required(
  opt: boolean | (() => boolean | Promise<boolean>) = true,
  schema: any = {},
) {
  return Field(
    _.extend({}, schema, {
      required: _.isFunction(opt) ? combineValidator(opt) : opt,
    }),
  );
}

export function IndexField(schema: any = {}) {
  return Field(
    _.extend({}, schema, {
      index: true,
    }),
  );
}

export function Unique(schema: any = {}) {
  return Field(
    _.extend({}, schema, {
      index: true,
      unique: true,
    }),
  );
}

export function Default(defaultValue: any, schema: any = {}) {
  return Field(
    _.extend({}, schema, {
      default: defaultValue,
    }),
  );
}

export function MapField(type: any, schema: any = {}) {
  return Field(
    _.extend({}, schema, {
      type: Map,
      of: type,
    }),
  );
}

export function Optional(schema: any = {}) {
  return Field(schema);
}

export function Validate(validator: Validator, schema: any = {}) {
  return Field(
    _.extend({}, schema, {
      validate: {
        validator: combineValidator(validator.validator),
        message: validator.message,
      },
    }),
  );
}

export function Field(schema: any = {}): PropertyDecorator {
  function mapModelSchema(o: any): any {
    if (_.isArray(o)) {
      return _.map(o, (x) => mapModelSchema(x));
    } else if (_.isFunction(o)) {
      if (o.prototype instanceof Model) {
        const func = Object.getOwnPropertyDescriptor(
          o.__proto__,
          '$mongooseOptions',
        );
        return func.value.call(o).mongooseSchema;
      } else {
        return o;
      }
    } else if (_.isObject(o) && o.__proto__.constructor.name === 'Object') {
      return _.mapObject(o, (x) => mapModelSchema(x));
    } else {
      return o;
    }
  }

  return (target: any, propertyName: string) => {
    const schemas = Reflect.getOwnMetadata(SCHEMA_KEY, target) || {};
    const existing = schemas[propertyName];

    if (schema.type == null && existing == null) {
      const type = Reflect.getMetadata('design:type', target, propertyName);
      schema.type = type;
    }

    if (
      _.isUndefined(schema.default) &&
      schema.type &&
      schema.type.prototype instanceof Model
    ) {
      schema.default = () => ({});
    }

    schemas[propertyName] = _.extend({}, existing, mapModelSchema(schema));
    Reflect.defineMetadata(SCHEMA_KEY, schemas, target);
  };
}

export function Mixin(model: ModelType) {
  return <T extends new (...args: any[]) => {}>(constructor: T) => {
    const models: ModelType[] =
      Reflect.getOwnMetadata(MIXIN_KEY, constructor.prototype) || [];

    models.push(model);
    Reflect.defineMetadata(MIXIN_KEY, models, constructor.prototype);
  };
}

export function Config(config: SchemaOptions) {
  return <T extends new (...args: any[]) => {}>(constructor: T) => {
    const configs: SchemaOptions =
      Reflect.getOwnMetadata(CONFIG_KEY, constructor.prototype) || {};

    _.extend(configs, config);
    Reflect.defineMetadata(CONFIG_KEY, configs, constructor.prototype);
  };
}

export function Plugin(plugin: Plugin) {
  return <T extends new (...args: any[]) => {}>(constructor: T) => {
    const plugins: Plugin[] =
      Reflect.getOwnMetadata(PLUGIN_KEY, constructor.prototype) || [];

    plugins.push(plugin);
    Reflect.defineMetadata(PLUGIN_KEY, plugins, constructor.prototype);
  };
}

export function Pre(pre: Pre) {
  return <T extends new (...args: any[]) => {}>(constructor: T) => {
    pushMetadata(PRE_KEY, constructor.prototype, pre);
  };
}

export function Pres(names: string[], pre: PPre) {
  return <T extends new (...args: any[]) => {}>(constructor: T) => {
    const pres = _.map(names, (name) => _.extend({ name }, pre));
    pushMetadata(PRE_KEY, constructor.prototype, ...pres);
  };
}

export function Virtual(options: VirtualOptions) {
  return (target: any, propertyName: string) => {
    const virtuals: Virtual[] =
      Reflect.getOwnMetadata(VIRTUAL_KEY, target) || [];
    virtuals.push({
      name: propertyName,
      options,
    });
    Reflect.defineMetadata(VIRTUAL_KEY, virtuals, target);
  };
}

export function Post(post: Post) {
  return <T extends new (...args: any[]) => {}>(constructor: T) => {
    const posts: Post[] =
      Reflect.getOwnMetadata(POST_KEY, constructor.prototype) || [];
    posts.push(post);
    Reflect.defineMetadata(POST_KEY, posts, constructor.prototype);
  };
}

export function Posts(names: string[], post: PPost) {
  return <T extends new (...args: any[]) => {}>(constructor: T) => {
    const posts: Post[] =
      Reflect.getOwnMetadata(POST_KEY, constructor.prototype) || [];
    for (const name of names) {
      posts.push(_.extend({ name }, post));
    }
    Reflect.defineMetadata(POST_KEY, posts, constructor.prototype);
  };
}

export function Index(index: Index) {
  return <T extends new (...args: any[]) => {}>(constructor: T) => {
    const indexes: Index[] =
      Reflect.getOwnMetadata(INDEX_KEY, constructor.prototype) || [];
    indexes.push(index);
    Reflect.defineMetadata(INDEX_KEY, indexes, constructor.prototype);
  };
}

export function UpdateValidator(validate: UpdateValidator) {
  return <T extends new (...args: any[]) => {}>(constructor: T) => {
    const validates: UpdateValidator[] =
      Reflect.getOwnMetadata(UPDATE_VALIDATOR_KEY, constructor.prototype) || [];
    validates.push(validate);
    Reflect.defineMetadata(
      UPDATE_VALIDATOR_KEY,
      validates,
      constructor.prototype,
    );
  };
}

/**
 * Mongoose options for current model.
 */
export interface MongooseOptions {
  config?: SchemaOptions;
  schema?: {};
  mongooseSchema?: Schema;
  pres?: Pre[];
  posts?: Post[];
  virtuals?: Virtual[];
  methods?: Method[];
  statics?: Method[];
  plugins?: Plugin[];
  indexes?: Index[];
  updateValidators?: UpdateValidator[];
}

export interface MongooseOptionsMap {
  [key: string]: MongooseOptions;
}

export interface Pre {
  name: string;
  fn: (next: (err?: NativeError) => void) => void;
  parallel?: boolean;
  errorCb?: (err: Error) => void;
}

export interface PPre {
  fn: (next: (err?: NativeError) => void) => void;
  parallel?: boolean;
  errorCb?: (err: Error) => void;
}

export interface Post {
  name: string;
  fn: PostFn1 | PostFn2;
}

export interface PPost {
  fn: PostFn1 | PostFn2;
}

export type PostFn1 = (doc: object, next: (err?: NativeError) => void) => void;
export type PostFn2 = (
  error: MongoError,
  doc: object,
  next: (err?: NativeError) => void,
) => void;

export interface Virtual {
  name: string;
  get?: () => any;
  set?: (val?: any) => void;
  options?: VirtualOptions;
}

export interface Method {
  name: string;
  fn: () => void;
}

export interface Plugin {
  fn: (schema: Schema, options?: object) => void;
  options?: object;
  priority?: number;
}

export interface Index {
  fields: object;
  options?: {
    expires?: string;
    [other: string]: any;
  };
}

export interface Validator {
  validator: (v: any) => any;
  message: string | ((props: { value: any }) => string);
}

export interface UpdateValidator {
  path: string;
  fn: (val?: any) => boolean;
  errorMsg?: string;
  type?: string;
}

export interface VirtualOptions {
  ref: string;
  localField: string;
  foreignField: string;
  justOne?: boolean;
  options?: any;
  count?: boolean;
  match?: object;
}

export class NativeError extends global.Error {}

export const preQueries = [
  'find',
  'findOne',
  'count',
  'findOneAndUpdate',
  'findOneAndRemove',
  'update',
];

const STATIC_FILTER_NAMES = ['name', 'length', 'prototype'];

export function combineValidator<T>(
  fn: (this: T, _v: any) => boolean | Promise<boolean>,
): () => boolean | Promise<boolean> {
  return function (this: T | Query<T>) {
    if (this instanceof Query) {
      return fn.apply(this.getUpdate().$set, arguments);
    } else {
      return fn.apply(this, arguments);
    }
  };
}
