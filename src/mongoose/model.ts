import * as _ from 'underscore'
import {
  Document, Model as MModel, Mongoose, Schema, SchemaOptions
} from 'mongoose'
import { MongoError } from 'mongodb'

export interface Model extends Document {}

// export var ModelType: new(...args: any[]) => ModelType
export type ModelType = typeof Model
export type IModel<E extends Model> = MModel<E>

declare module 'mongoose' {
  interface Schema {
    parentSchema?: Schema
  }

  interface SchemaType {
    options?:      SchemaTypeOptions
  }
}

export interface SchemaTypeOptions {
}

/**
 * Wrapped Model from mongoose.Model.
 */
export class Model {

  // reflects the configuration for current model.
  static $CONFIG: ModelConfig

  // preset the schema of current model.
  static $SCHEMA: {}

  private static $PRES: Pre[]

  private static $POSTS: Post[]

  private static $VIRTUALS: Virtual[]

  private static $PLUGINS: Plugin[]

  private static $INDEXES: Index[]

  private static $MIXINS: ModelType[]

  // placeholder for calculated mongoose options.
  static _mongooseOptions: MongooseOptions;

  static Config(config: ModelConfig): ModelType {
    this.$CONFIG = config;
    return this;
  }

  static Schema(schema: {}): ModelType {
    this.$SCHEMA = schema;
    return this;
  }

  static Pre(pre: Pre): ModelType {
    if (this.hasOwnProperty('$PRES')) {
      this.$PRES.push(pre);
    } else {
      this.$PRES = [pre];
    }
    return this;
  }

  static Post(post: Post): ModelType {
    if (this.hasOwnProperty('$POSTS')) {
      this.$POSTS.push(post);
    } else {
      this.$POSTS = [post];
    }
    return this;
  }

  static Virtual(virtual: Virtual): ModelType {
    if (this.hasOwnProperty('$VIRTUALS')) {
      this.$VIRTUALS.push(virtual);
    } else {
      this.$VIRTUALS = [virtual];
    }
    return this;
  }

  static Plugin(plugin: Plugin): ModelType {
    if (this.hasOwnProperty('$PLUGINS')) {
      this.$PLUGINS.push(plugin);
    } else {
      this.$PLUGINS = [plugin];
    }
    return this;
  }

  static Index(index: Index): ModelType {
    if (this.hasOwnProperty('$INDEXES')) {
      this.$INDEXES.push(index);
    } else {
      this.$INDEXES = [index];
    }
    return this;
  }

  static Mixin(model: ModelType): ModelType {
    if (this.hasOwnProperty('$MIXINS')) {
      this.$MIXINS.push(model);
    } else {
      this.$MIXINS = [model];
    }
    return this;
  }

  static _$modifySchema(discriminatorKey: string) {
    if (!this.hasOwnProperty('$SCHEMA')) {
      this.$SCHEMA = {};
    }

    let uniqueFields: string[] = [];
    for (let name in this.$SCHEMA) {
      let opt = (this.$SCHEMA as any)[name];
      if (opt.unique) {
        opt.unique = false
        uniqueFields.push(name);
      }
    }

    for (let field of uniqueFields) {

      let fieldUniqueKey        = `${field}_unique`;
      let fields: any           = {};
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
          unique:  true
        }
      });
    }

    (this.$SCHEMA as any)[discriminatorKey] = { type: String };

    this.Pre({
      name: 'save',
      fn: setDiscriminatorKey,
    });

    for (let name of preQueries) {
      this.Pre({ name, fn: patchDiscriminatorKey });
    }

    function setDiscriminatorKey(next: Function) {
      if (this[discriminatorKey] == null) {
        this[discriminatorKey] = this.constructor.modelName;
      }
      next();
    }

    function patchDiscriminatorKey() {
      this._conditions[discriminatorKey] = this.model.modelName;
    }
  }

  static $mongooseOptions(): MongooseOptions {
    this._$initialize();
    if (this._mongooseOptions.initialized || this === Model) {
      return this._mongooseOptions;
    }

    let superClass = (this as any).__proto__ as ModelType;

    let superOptions: MongooseOptions = (
      superClass.$mongooseOptions? superClass.$mongooseOptions() : {
        initialized: false
      }
    );

    if (superOptions.config.discriminatorKey) {
      this._$modifySchema(superOptions.config.discriminatorKey);
    }

    let mixinModels = this.hasOwnProperty('$MIXINS') ? this.$MIXINS : [];
    let mixinOptions = _.map(mixinModels, (model) => model.$mongooseOptions());

    let mixinSchemas   = _.map(mixinOptions, (opt) => opt.schema);
    let flattenSchemas = _.flatten(
      [{}, mixinSchemas, superOptions.schema, this.$SCHEMA]
    );
    this._mongooseOptions.schema = _.extend.apply(null, flattenSchemas);

    let mixinConfigs   = _.map(mixinOptions, (opt) => opt.config);
    let flattenConfigs = _.flatten(
      [{}, mixinConfigs, superOptions.config, this.$CONFIG]
    );
    this._mongooseOptions.config = _.extend.apply(null, flattenConfigs);

    let mixinPres = _.map(mixinOptions, (opt) => opt.pres);
    this._mongooseOptions.pres = _.union(_.flatten([
      mixinPres, superOptions.pres || [],
      this.hasOwnProperty('$PRES') ?  this.$PRES : []
    ]));

    let mixinPosts = _.map(mixinOptions, (opt) => opt.posts);
    this._mongooseOptions.posts = _.union(_.flatten([
      mixinPosts, superOptions.posts || [],
      this.hasOwnProperty('$POSTS') ? this.$POSTS : []
    ]));

    let mixinVirtuals = _.map(mixinOptions, (opt) => opt.virtuals);
    this._mongooseOptions.virtuals = _.union(_.flatten([
      mixinVirtuals, superOptions.virtuals || [],
      this.hasOwnProperty('$VIRTUALS') ? this.$VIRTUALS : []
    ]));

    let mixinPlugins = _.map(mixinOptions, (opt) => opt.plugins);
    this._mongooseOptions.plugins = _.union(_.flatten([
      mixinPlugins, superOptions.plugins || [],
      this.hasOwnProperty('$PLUGINS') ? this.$PLUGINS : []
    ]));

    let mixinIndexes = _.map(mixinOptions, (opt) => opt.indexes);
    this._mongooseOptions.indexes = _.union(_.flatten([
      mixinIndexes, superOptions.indexes || [],
      this.hasOwnProperty('$INDEXES') ? this.$INDEXES : []
    ]));

    let mixinMethods = _.map(mixinOptions, (opt) => opt.methods);
    this._mongooseOptions.methods = _.union(_.flatten([
      mixinMethods, superOptions.methods || []
    ]));

    let mixinStatics = _.map(mixinOptions, (opt) => opt.statics);
    this._mongooseOptions.statics = _.union(_.flatten([
      mixinStatics, superOptions.statics || []
    ]));

    for (let name of Object.getOwnPropertyNames(this.prototype)) {
      if (name === 'constructor') {
        continue;
      }

      let descriptor = Object.getOwnPropertyDescriptor(this.prototype, name);

      if (descriptor.value && _.isFunction(descriptor.value)) {
        this._mongooseOptions.methods.push({
          name: name,
          fn: descriptor.value,
        });
      }

      if (descriptor.get || descriptor.set) {
        this._mongooseOptions.virtuals.push({
          name: name,
          get: descriptor.get,
          set: descriptor.set,
        });
      }
    }

    for (let name of Object.getOwnPropertyNames(this)) {
      let descriptor = Object.getOwnPropertyDescriptor(this, name);

      if (descriptor.value && _.isFunction(descriptor.value)) {
        this._mongooseOptions.statics.push({
          name: name,
          fn: descriptor.value,
        });
      }
    }

    var mongooseSchema = new Schema(
      this._mongooseOptions.schema, _.clone(this._mongooseOptions.config)
    );

    mongooseSchema.parentSchema = superOptions.mongooseSchema;

    for (let pre of this._mongooseOptions.pres) {
      pre.parallel = pre.parallel || false;
      mongooseSchema.pre(pre.name, pre.parallel, pre.fn, pre.errorCb);
    }

    for (let post of this._mongooseOptions.posts) {
      (mongooseSchema as any).post(post.name, post.fn);
    }

    for (let virtual of this._mongooseOptions.virtuals) {
      let v = mongooseSchema.virtual(virtual.name);
      if (virtual.get) {
        v = v.get(virtual.get);
      }
      if (virtual.set) {
        v = v.set(virtual.set);
      }
    }

    for (let method of this._mongooseOptions.methods) {
      mongooseSchema.methods[method.name] = method.fn;
    }

    for (let method of this._mongooseOptions.statics) {
      mongooseSchema.statics[method.name] = method.fn;
    }

    for (let plugin of this._mongooseOptions.plugins) {
      let options = _.extend({}, this._mongooseOptions.config, plugin.options);
      mongooseSchema.plugin(plugin.fn, options);
    }

    for (let index of this._mongooseOptions.indexes) {
      mongooseSchema.index(index);
    }

    this._mongooseOptions.mongooseSchema  = mongooseSchema;
    this._mongooseOptions.initialized     = true;
    return this._mongooseOptions;
  }

  static $register<D extends Document, M>(
    mongooseInstance?: Mongoose
  ): MModel<D> & M {
    if (!mongooseInstance) {
      mongooseInstance = require('mongoose');
    }

    let model: (MModel<D> & M) = mongooseInstance.model(
      this.name, this.$mongooseOptions().mongooseSchema
    ) as (MModel<D> & M);
    return model;
  }

  static _$initialize() {
    if (this.hasOwnProperty('_mongooseOptions')) {
      return;
    }
    this._mongooseOptions = {
      initialized:  false,
      config:       {},
    };
  }

  static cast<D extends Model>(): IModel<D> {
    return this as any as IModel<D>;
  }
}

/**
 * Configuration for Model.
 */
export interface ModelConfig extends SchemaOptions {
  discriminatorKey?: string
}

/**
 * Mongoose options for current model.
 */
export interface MongooseOptions {
  initialized:     boolean
  config?:         ModelConfig
  schema?:         {}
  mongooseSchema?: Schema
  pres?:           Pre[]
  posts?:          Post[]
  virtuals?:       Virtual[]
  methods?:        Method[]
  statics?:        Method[]
  plugins?:        Plugin[]
  indexes?:        Index[]
}

export interface Pre {
  name:      string
  fn:        (next: (err?: NativeError) => void) => void
  parallel?: boolean
  errorCb?:  (err: Error) => void
}

export interface Post {
  name:      string
  fn:        PostFn1 | PostFn2
}

export type PostFn1 = (doc: object, next: (err?: NativeError) => void) => void
export type PostFn2 = (error: MongoError, doc: object, next: (err?: NativeError) => void) => void

export interface Virtual {
  name:     string
  get?:     Function
  set?:     Function
}

export interface Method {
  name:     string
  fn:       Function
}

export interface Plugin {
  fn:        (schema:  Schema, options?:  Object) => void
  options?:  Object
}

export interface Index {
  fields:      Object
  options?:    {
    expires?:  string;
    [other:    string]:  any;
  }
}

export class NativeError extends global.Error {}

export var preQueries = [
  'find', 'findOne', 'count', 'findOneAndUpdate', 'findOneAndRemove', 'update'
]

const PointSchema = new Schema({
  type: {
    type:       String,
    enum:       ['Point'],
    default:    'Point',
  },
  coordinates: {
    type:       [Number],
    default:    [0, 0],
  }
});

// Patch MModel.prototype.init
let _init = MModel.prototype.init;

(MModel as any).cast = Model.cast;

MModel.prototype.init = function (doc: any, query: any, fn: Function) {
  let discriminatorKey = this.schema.options.discriminatorKey;
  let type = doc[discriminatorKey];

  if (type) {

    let model = this.db.model(type);

    if (model) {
      this.schema = model.schema;
      this.__proto__ = model.prototype;
      _init.call(this, doc, query);
      if (fn) { fn(null); }
      return this;
    }
  }

  _init.call(this, doc, query, fn);
}
