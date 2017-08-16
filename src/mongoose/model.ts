import * as _ from 'underscore'
import {
  Document, Model as MModel, Mongoose, Schema, SchemaOptions
} from 'mongoose'
import { MongoError } from 'mongodb'

export interface Model extends Document {}

// export var ModelType: new(...args: any[]) => ModelType
export type ModelType = typeof Model
export type IModel<E extends Model> = MModel<E>

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

    for (let field in uniqueFields) {

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

    this._mongooseOptions.schema = _.extend(
      {}, superOptions.schema, this.$SCHEMA
    );
    this._mongooseOptions.config = _.extend(
      {}, superOptions.config, this.$CONFIG
    );
    this._mongooseOptions.pres = _.union(
      superOptions.pres,
      this.hasOwnProperty('$PRES') ?  this.$PRES : []
    );
    this._mongooseOptions.posts = _.union(
      superOptions.posts,
      this.hasOwnProperty('$POSTS') ? this.$POSTS : []
    );
    this._mongooseOptions.virtuals = _.union(
      superOptions.virtuals,
      this.hasOwnProperty('$VIRTUALS') ? this.$VIRTUALS : []
    );
    this._mongooseOptions.methods = _.union(superOptions.methods);
    this._mongooseOptions.statics = _.union(superOptions.statics);
    this._mongooseOptions.plugins = _.union(
      superOptions.plugins,
      this.hasOwnProperty('$PLUGINS') ? this.$PLUGINS : []
    );
    this._mongooseOptions.indexes = _.union(
      superOptions.indexes,
      this.hasOwnProperty('$INDEXES') ? this.$INDEXES : []
    );

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
      mongooseSchema.plugin(plugin.fn, plugin.options);
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
