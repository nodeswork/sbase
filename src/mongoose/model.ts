import 'reflect-metadata';

import * as _         from 'underscore';
import {
  Document,
  Model as MModel,
  Mongoose,
  Schema,
  SchemaOptions,
  Types,
  SchemaTypes,
  DocumentToObjectOptions,
}                     from 'mongoose';
import { MongoError } from 'mongodb';
import { NModelType } from './';

// export var ModelType: new(...args: any[]) => ModelType
export type ModelType = typeof Model;
export type IModel<E extends DocumentModel> = MModel<E>;

/**
 * Wrapped Model from mongoose.Model.
 */
export class Model {

  // reflects the configuration for current model.
  public static $CONFIG:     SchemaOptions;

  // preset the schema of current model.
  public static $SCHEMA:     {};

  private static $PRES:      Pre[];

  private static $POSTS:     Post[];

  private static $VIRTUALS:  Virtual[];

  private static $PLUGINS:   Plugin[];

  private static $INDEXES:   Index[];

  private static $MIXINS:    ModelType[];

  private static $VALIDATES: Validate[];

  // placeholder for calculated mongoose options.
  private static _mongooseOptions:   MongooseOptions;

  public static Config(config: SchemaOptions): ModelType {
    if (this.hasOwnProperty('$CONFIG')) {
      _.extend(this.$CONFIG, config);
    } else {
      this.$CONFIG = config;
    }
    return this;
  }

  public static Schema(schema: {}): ModelType {
    if (this.hasOwnProperty('$SCHEMA')) {
      _.extend(this.$SCHEMA, schema);
    } else {
      this.$SCHEMA = schema;
    }
    return this;
  }

  public static Pre(pre: Pre): ModelType {
    if (this.hasOwnProperty('$PRES')) {
      this.$PRES.push(pre);
    } else {
      this.$PRES = [pre];
    }
    return this;
  }

  public static Post(post: Post): ModelType {
    if (this.hasOwnProperty('$POSTS')) {
      this.$POSTS.push(post);
    } else {
      this.$POSTS = [post];
    }
    return this;
  }

  public static Virtual(virtual: Virtual): ModelType {
    if (this.hasOwnProperty('$VIRTUALS')) {
      this.$VIRTUALS.push(virtual);
    } else {
      this.$VIRTUALS = [virtual];
    }
    return this;
  }

  public static Plugin(plugin: Plugin): ModelType {
    if (this.hasOwnProperty('$PLUGINS')) {
      this.$PLUGINS.push(plugin);
    } else {
      this.$PLUGINS = [plugin];
    }
    return this;
  }

  public static Index(index: Index): ModelType {
    if (this.hasOwnProperty('$INDEXES')) {
      this.$INDEXES.push(index);
    } else {
      this.$INDEXES = [index];
    }
    return this;
  }

  public static Mixin(model: ModelType): ModelType {
    if (this.hasOwnProperty('$MIXINS')) {
      this.$MIXINS.push(model);
    } else {
      this.$MIXINS = [model];
    }
    return this;
  }

  public static Validate(validate: Validate): ModelType {
    if (this.hasOwnProperty('$VALIDATES')) {
      this.$VALIDATES.push(validate);
    } else {
      this.$VALIDATES = [validate];
    }
    return this;
  }

  private static _$modifySchema(discriminatorKey: string) {
    if (!this.hasOwnProperty('$SCHEMA')) {
      this.$SCHEMA = {};
    }

    const uniqueFields: string[] = [];
    for (const name in this.$SCHEMA) {
      const opt = (this.$SCHEMA as any)[name];
      if (opt.unique) {
        opt.unique = false;
        uniqueFields.push(name);
      }
    }

    for (const field of uniqueFields) {

      const fieldUniqueKey      = `${field}_unique`;
      const fields: any         = {};
      fields[discriminatorKey]  = 1;
      fields[field]             = 1;
      fields[fieldUniqueKey]    = '2dsphere';

      (this.$SCHEMA as any)[fieldUniqueKey] = {
        type:       PointSchema,
        // api:        AUTOGEN,
        default:    PointSchema,
        // dataLevel:  'HIDDEN',
      };

      this.Index({
        fields,
        options:   {
          unique:  true,
        },
      });
    }

    (this.$SCHEMA as any)[discriminatorKey] = { type: String };

    this.Pre({
      name: 'save',
      fn: setDiscriminatorKey,
    });

    for (const name of preQueries) {
      this.Pre({ name, fn: patchDiscriminatorKey });
    }

    function setDiscriminatorKey(next: () => void) {
      if (this[discriminatorKey] == null) {
        this[discriminatorKey] = this.constructor.modelName;
      }
      next();
    }

    function patchDiscriminatorKey() {
      this._conditions[discriminatorKey] = this.model.modelName;
    }
  }

  public static get $schema(): Schema {
    return this.$mongooseOptions().mongooseSchema;
  }

  public static $mongooseOptions(): MongooseOptions {
    this._$initialize();
    if (this._mongooseOptions.initialized || this === Model) {
      return this._mongooseOptions;
    }

    const superClass = (this as any).__proto__ as ModelType;

    const superOptions: MongooseOptions = (
      superClass.$mongooseOptions ? superClass.$mongooseOptions() : {
        initialized: false,
      }
    );

    if (superOptions.config.discriminatorKey) {
      this._$modifySchema(superOptions.config.discriminatorKey);
    }

    const mixinModels  = _.union(_.flatten([
      Reflect.getOwnMetadata(mixinKey, this.prototype) || [],
      this.hasOwnProperty('$MIXINS') ? this.$MIXINS : [],
    ]));
    const mixinOptions = _.map(mixinModels, (model) => model.$mongooseOptions());

    const mixinSchemas   = _.map(mixinOptions, (opt) => opt.schema);
    const decoSchema     = Reflect.getOwnMetadata(schemaKey, this.prototype) || {};
    const flattenSchemas = _.flatten(
      [{}, mixinSchemas, superOptions.schema, this.$SCHEMA, decoSchema],
    );
    this._mongooseOptions.schema = _.extend.apply(null, flattenSchemas);

    const mixinConfigs   = _.map(mixinOptions, (opt) => opt.config);
    const decoConfigs = Reflect.getOwnMetadata(configKey, this.prototype) || {};
    const flattenConfigs = _.flatten(
      [{}, mixinConfigs, superOptions.config, this.$CONFIG, decoConfigs],
    );
    this._mongooseOptions.config = _.extend.apply(null, flattenConfigs);

    const mixinPres = _.map(mixinOptions, (opt) => opt.pres);
    const decoPres  = Reflect.getOwnMetadata(preKey, this.prototype) || [];
    this._mongooseOptions.pres = _.union(_.flatten([
      mixinPres, superOptions.pres || [],
      this.hasOwnProperty('$PRES') ?  this.$PRES : [],
      decoPres,
    ]));

    const mixinPosts = _.map(mixinOptions, (opt) => opt.posts);
    const decoPosts  = Reflect.getOwnMetadata(postKey, this.prototype) || [];
    this._mongooseOptions.posts = _.union(_.flatten([
      mixinPosts, superOptions.posts || [],
      this.hasOwnProperty('$POSTS') ? this.$POSTS : [],
      decoPosts,
    ]));

    const mixinVirtuals = _.map(mixinOptions, (opt) => opt.virtuals);
    this._mongooseOptions.virtuals = _.union(_.flatten([
      mixinVirtuals, superOptions.virtuals || [],
      this.hasOwnProperty('$VIRTUALS') ? this.$VIRTUALS : [],
    ]));

    const mixinValidates = _.map(mixinOptions, (opt) => opt.validates);
    const decoValidates  = Reflect.getOwnMetadata(validateKey, this.prototype);
    this._mongooseOptions.validates = _.union(_.flatten([
      mixinValidates, superOptions.validates || [],
      this.hasOwnProperty('$VALIDATES') ? this.$VALIDATES : [],
      decoValidates || [],
    ]));

    const mixinPlugins = _.map(mixinOptions, (opt) => opt.plugins);
    const decoPlugins = Reflect.getOwnMetadata(pluginKey, this.prototype) || [];
    this._mongooseOptions.plugins = _.union(_.flatten([
      mixinPlugins, superOptions.plugins || [],
      this.hasOwnProperty('$PLUGINS') ? this.$PLUGINS : [],
      decoPlugins,
    ]));
    this._mongooseOptions.plugins = _.sortBy(
      this._mongooseOptions.plugins,
      (plugin) => plugin.priority,
    );

    const mixinIndexes = _.map(mixinOptions, (opt) => opt.indexes);
    const decoIndexes  = Reflect.getOwnMetadata(indexKey, this.prototype) || [];
    this._mongooseOptions.indexes = _.union(_.flatten([
      mixinIndexes, superOptions.indexes || [],
      this.hasOwnProperty('$INDEXES') ? this.$INDEXES : [],
      decoIndexes,
    ]));

    const mixinMethods = _.map(mixinOptions, (opt) => opt.methods);
    this._mongooseOptions.methods = _.union(_.flatten([
      mixinMethods, superOptions.methods || [],
    ]));

    const mixinStatics = _.map(mixinOptions, (opt) => opt.statics);
    this._mongooseOptions.statics = _.union(_.flatten([
      mixinStatics, superOptions.statics || [],
    ]));

    for (const name of Object.getOwnPropertyNames(this.prototype)) {
      if (name === 'constructor') {
        continue;
      }

      const descriptor = Object.getOwnPropertyDescriptor(this.prototype, name);

      if (descriptor.value && _.isFunction(descriptor.value)) {
        this._mongooseOptions.methods.push({
          name,
          fn: descriptor.value,
        });
      }

      if (descriptor.get || descriptor.set) {
        this._mongooseOptions.virtuals.push({
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
        this._mongooseOptions.statics.push({
          name,
          fn: descriptor.value,
        });
      }
    }

    const mongooseSchema = new Schema(
      this._mongooseOptions.schema, _.clone(this._mongooseOptions.config),
    );

    (mongooseSchema as any).parentSchema = superOptions.mongooseSchema;

    for (const pre of this._mongooseOptions.pres) {
      pre.parallel = pre.parallel || false;
      mongooseSchema.pre(pre.name, pre.parallel, pre.fn, pre.errorCb);
    }

    for (const post of this._mongooseOptions.posts) {
      (mongooseSchema as any).post(post.name, post.fn);
    }

    for (const virtual of this._mongooseOptions.virtuals) {
      let v = mongooseSchema.virtual(virtual.name);
      if (virtual.get) {
        v = v.get(virtual.get);
      }
      if (virtual.set) {
        v = v.set(virtual.set);
      }
    }

    for (const method of this._mongooseOptions.methods) {
      mongooseSchema.methods[method.name] = method.fn;
    }

    for (const method of this._mongooseOptions.statics) {
      mongooseSchema.statics[method.name] = method.fn;
    }

    for (const plugin of this._mongooseOptions.plugins) {
      const options = _.extend({}, this._mongooseOptions.config, plugin.options);
      mongooseSchema.plugin(plugin.fn, options);
    }

    for (const index of this._mongooseOptions.indexes) {
      mongooseSchema.index(index.fields, index.options);
    }

    for (const validate of this._mongooseOptions.validates) {
      mongooseSchema
        .path(validate.path)
        .validate(validate.fn, validate.errorMsg, validate.type);
    }

    this._mongooseOptions.mongooseSchema  = mongooseSchema;
    this._mongooseOptions.initialized     = true;
    return this._mongooseOptions;
  }

  public static $register<D extends Document, M>(
    mongooseInstance?: Mongoose,
  ): MModel<D> & M {
    if (!mongooseInstance) {
      mongooseInstance = require('mongoose');
    }

    return mongooseInstance.model(this.name, this.$schema) as (MModel<D> & M);
  }

  public static $registerNModel<D extends Document, M>(
    mongooseInstance?: Mongoose,
  ): MModel<D> & M & NModelType {
    if (!mongooseInstance) {
      mongooseInstance = require('mongoose');
    }

    return mongooseInstance.model(this.name, this.$schema) as (
      MModel<D> & M & NModelType
    );
  }

  public static _$initialize() {
    if (this.hasOwnProperty('_mongooseOptions')) {
      return;
    }
    this._mongooseOptions = {
      initialized:  false,
      config:       {},
    };
  }

  public static cast<D extends DocumentModel>(): IModel<D> {
    return this as any as IModel<D>;
  }
}

export interface DocumentModel extends Document {
}

export class DocumentModel extends Model {
}

const schemaKey      = Symbol('sbase:schema');
const configKey      = Symbol('sbase:config');
const pluginKey      = Symbol('sbase:plugin');
const preKey         = Symbol('sbase:pre');
const postKey        = Symbol('sbase:post');
const indexKey       = Symbol('sbase:index');
const validateKey    = Symbol('sbase:validate');
const mixinKey       = Symbol('sbase:mixin');

export function Enum(e: any, schema: any = {}) {
  return Field(_.extend({}, schema, {
    type: String,
    enum: Object.values(e),
  }));
}

export function DBRef(ref: string, schema: any = {}) {
  return Field(_.extend({}, schema, {
    type: SchemaTypes.ObjectId,
    ref,
  }));
}

export function DBRefArray(ref: string, schema: any = {}) {
  return Field(_.extend({}, schema, {
    type: [
      {
        type: SchemaTypes.ObjectId,
        ref,
      },
    ],
  }));
}

export function ArrayField(type: any, schema: any = {}) {
  return Field(_.extend({}, schema, {
    type:    [type],
    default: [],
  }));
}

export function Required(schema: any = {}) {
  return Field(_.extend({}, schema, {
    required: true,
  }));
}

export function IndexField(schema: any = {}) {
  return Field(_.extend({}, schema, {
    index: true,
  }));
}

export function Unique(schema: any = {}) {
  return Field(_.extend({}, schema, {
    index:     true,
    required:  true,
    unique:    true,
  }));
}

export function Default(defaultValue: any, schema: any = {}) {
  return Field(_.extend({}, schema, {
    default: defaultValue,
  }));
}

export function MapField(type: any, schema: any = {}) {
  return Field(_.extend({}, schema, {
    type: Map,
    of:   type,
  }));
}

export function Field(schema: any = {}) {
  function mapModelSchame(o: any): any {
    if (_.isArray(o)) {
      return _.map(o, x => mapModelSchame(x));
    } else if (_.isFunction(o)) {
      if (o.prototype instanceof Model) {
        return o.__proto__.$mongooseOptions.call(o).mongooseSchema;
      } else {
        return o;
      }
    } else if (_.isObject(o) && o.__proto__.constructor.name === 'Object') {
      return _.mapObject(o, x => mapModelSchame(x));
    } else {
      return o;
    }
  }

  return (target: any, propertyName: string) => {
    const schemas = Reflect.getOwnMetadata(schemaKey, target) || {};
    const existing = schemas[propertyName];

    if (schema.type == null && existing == null) {
      let type = Reflect.getMetadata("design:type", target, propertyName);
      schema.type = type;
    }
    if (schema.default === undefined && schema.type && (
      _.isArray(schema.type) && schema.type[0] &&
      schema.type[0].prototype instanceof Model
      || schema.type.prototype instanceof Model
    )) {
      schema.default = schema.type;
    }

    schemas[propertyName] = _.extend({}, existing, mapModelSchame(schema));
    Reflect.defineMetadata(schemaKey, schemas, target);
  };
}

export function Mixin(model: ModelType) {
  return <T extends { new(...args: any[]): {} }>(constructor: T) => {
    const models: ModelType[] = Reflect.getOwnMetadata(
      mixinKey, constructor.prototype,
    ) || [];

    models.push(model);
    Reflect.defineMetadata(mixinKey, models, constructor.prototype);
  };
}

export function Config(config: SchemaOptions) {
  return <T extends { new(...args: any[]): {} }>(constructor: T) => {
    const configs: SchemaOptions = Reflect.getOwnMetadata(
      configKey, constructor.prototype,
    ) || {};

    _.extend(configs, config);
    Reflect.defineMetadata(configKey, configs, constructor.prototype);
  };
}

export function Plugin(plugin: Plugin) {
  return <T extends { new(...args: any[]): {} }>(constructor: T) => {
    const plugins: Plugin[] = Reflect.getOwnMetadata(
      pluginKey, constructor.prototype,
    ) || [];

    plugins.push(plugin);
    Reflect.defineMetadata(pluginKey, plugins, constructor.prototype);
  };
}

export function Pre(pre: Pre) {
  return <T extends { new(...args: any[]): {} }>(constructor: T) => {
    const pres: Pre[] = Reflect.getOwnMetadata(
      preKey, constructor.prototype,
    ) || [];

    pres.push(pre);
    Reflect.defineMetadata(preKey, pres, constructor.prototype);
  };
}

export function Pres(names: string[], pre: PPre) {
  return <T extends { new(...args: any[]): {} }>(constructor: T) => {
    const pres: Pre[] = Reflect.getOwnMetadata(
      preKey, constructor.prototype,
    ) || [];

    for (const name of names) {
      pres.push(_.extend({name}, pre));
    }
    Reflect.defineMetadata(preKey, pres, constructor.prototype);
  };
}

export function Post(post: Post) {
  return <T extends { new(...args: any[]): {} }>(constructor: T) => {
    const posts: Post[] = Reflect.getOwnMetadata(
      postKey, constructor.prototype,
    ) || [];
    posts.push(post);
    Reflect.defineMetadata(postKey, posts, constructor.prototype);
  };
}

export function Posts(names: string[], post: PPost) {
  return <T extends { new(...args: any[]): {} }>(constructor: T) => {
    const posts: Post[] = Reflect.getOwnMetadata(
      postKey, constructor.prototype,
    ) || [];
    for (const name of names) {
      posts.push(_.extend({name}, post));
    }
    Reflect.defineMetadata(postKey, posts, constructor.prototype);
  };
}

export function Index(index: Index) {
  return <T extends { new(...args: any[]): {} }>(constructor: T) => {
    const indexes: Index[] = Reflect.getOwnMetadata(
      indexKey, constructor.prototype,
    ) || [];
    indexes.push(index);
    Reflect.defineMetadata(indexKey, indexes, constructor.prototype);
  };
}

export function Validate(validate: Validate) {
  return <T extends { new(...args: any[]): {} }>(constructor: T) => {
    const validates: Validate[] = Reflect.getOwnMetadata(
      validateKey, constructor.prototype,
    ) || [];
    validates.push(validate);
    Reflect.defineMetadata(validateKey, validates, constructor.prototype);
  };
}

/**
 * Mongoose options for current model.
 */
export interface MongooseOptions {
  initialized:     boolean;
  config?:         SchemaOptions;
  schema?:         {};
  mongooseSchema?: Schema;
  pres?:           Pre[];
  posts?:          Post[];
  virtuals?:       Virtual[];
  methods?:        Method[];
  statics?:        Method[];
  plugins?:        Plugin[];
  indexes?:        Index[];
  validates?:      Validate[];
}

export interface Pre {
  name:      string;
  fn:        (next: (err?: NativeError) => void) => void;
  parallel?: boolean;
  errorCb?:  (err: Error) => void;
}

export interface PPre {
  fn:        (next: (err?: NativeError) => void) => void;
  parallel?: boolean;
  errorCb?:  (err: Error) => void;
}

export interface Post {
  name:      string;
  fn:        PostFn1 | PostFn2;
}

export interface PPost {
  fn:        PostFn1 | PostFn2;
}

export type PostFn1 = (doc: object, next: (err?: NativeError) => void) => void;
export type PostFn2 = (error: MongoError, doc: object, next: (err?: NativeError) => void) => void;

export interface Virtual {
  name:     string;
  get?:     () => any;
  set?:     (val?: any) => void;
}

export interface Method {
  name:     string;
  fn:       () => void;
}

export interface Plugin {
  fn:         (schema:  Schema, options?:  object) => void;
  options?:   object;
  priority?:  number;
}

export interface Index {
  fields:      object;
  options?:    {
    expires?:  string;
    [other:    string]:  any;
  };
}

export interface Validate {
  path:        string;
  fn:          (val?: any) => boolean;
  errorMsg?:   string;
  type?:       string;
}

export class NativeError extends global.Error {}

export const preQueries = [
  'find', 'findOne', 'count', 'findOneAndUpdate', 'findOneAndRemove', 'update',
];

const PointSchema = new Schema({
  type: {
    type:       String,
    enum:       ['Point'],
    default:    'Point',
  },
  coordinates: {
    type:       [Number],
    default:    [0, 0],
  },
});

const STATIC_FILTER_NAMES = [
  'name', 'prototype', '_mongooseOptions', '$PLUGINS', '$PRES', '$SCHEMA',
  '$MIXINS', '$CONFIG', '$INDEXES',
];

// Patch MModel.prototype.init
const _init = MModel.prototype.init;

(MModel as any).cast = Model.cast;

MModel.prototype.init = function(
  doc: any, query: any, fn: (res?: any) => void,
) {
  const discriminatorKey = this.schema.options.discriminatorKey;
  const type = doc[discriminatorKey];

  if (type) {

    const model = this.db.model(type);

    if (model) {
      this.schema = model.schema;
      this.__proto__ = model.prototype;
      _init.call(this, doc, query);
      if (fn) { fn(null); }
      return this;
    }
  }

  _init.call(this, doc, query, fn);
};
