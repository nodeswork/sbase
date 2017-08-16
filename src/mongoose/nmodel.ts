import * as _ from 'underscore'
import {
  Document, Model, Mongoose, Schema, SchemaOptions
} from 'mongoose'
import { MongoError } from 'mongodb'

export module mongoose {

  export interface NModel extends Document {}

  export var NModelType: new(...args: any[]) => NModelType
  export type NModelType = typeof NModel
  export type INModel<E extends NModel> = Model<E>

  export class NModel {

    // reflects the configuration for current model.
    static $CONFIG: NModelConfig

    // preset the schema of current model.
    static $SCHEMA: {}

    private static $PRES: Pre[]

    private static $POSTS: Post[]

    private static $VIRTUALS: Virtual[]

    // placeholder for calculated mongoose options.
    static _mongooseOptions: MongooseOptions;

    static Config(config: NModelConfig): NModelType {
      this.$CONFIG = config;
      return this;
    }

    static Schema(schema: {}): NModelType {
      this.$SCHEMA = schema;
      return this;
    }

    static Pre(pre: Pre): NModelType {
      if (this.hasOwnProperty('$PRES')) {
        this.$PRES.push(pre);
      } else {
        this.$PRES = [pre];
      }
      return this;
    }

    static Post(post: Post): NModelType {
      if (this.hasOwnProperty('$POSTS')) {
        this.$POSTS.push(post);
      } else {
        this.$POSTS = [post];
      }
      return this;
    }

    static Virtual(virtual: Virtual): NModelType {
      if (this.hasOwnProperty('$VIRTUALS')) {
        this.$VIRTUALS.push(virtual);
      } else {
        this.$VIRTUALS = [virtual];
      }
      return this;
    }

    static $mongooseOptions(): MongooseOptions {
      this._$initialize();
      if (this._mongooseOptions.initialized) {
        return this._mongooseOptions;
      }

      // TODO: expand fields from super class.
      this._mongooseOptions.schema = this.$SCHEMA;
      this._mongooseOptions.config = this.$CONFIG;
      this._mongooseOptions.pres = (
        this.hasOwnProperty('$PRES') ?  this.$PRES : []
      );
      this._mongooseOptions.posts = (
        this.hasOwnProperty('$POSTS') ? this.$POSTS : []
      );
      this._mongooseOptions.virtuals = (
        this.hasOwnProperty('$VIRTUALS') ? this.$VIRTUALS : []
      );
      this._mongooseOptions.methods = [];
      this._mongooseOptions.statics = [];

      for (let name of Object.getOwnPropertyNames(this.prototype)) {
        if (name === 'constructor') {
          continue;
        }

        let descriptor = Object.getOwnPropertyDescriptor(this.prototype, name);

        if (descriptor.value && _.isFunction(descriptor.value)) {
          console.log('method', name);
          this._mongooseOptions.methods.push({
            name: name,
            fn: descriptor.value,
          });
        }

        if (descriptor.get || descriptor.set) {
          console.log('virtual method', name);
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
          console.log('static', name);
          this._mongooseOptions.statics.push({
            name: name,
            fn: descriptor.value,
          });
        }
      }

      var mongooseSchema = new Schema(
        this._mongooseOptions.schema, this._mongooseOptions.config
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
        console.log('methods', method.name)
      }

      for (let method of this._mongooseOptions.statics) {
        console.log('statics', method.name)
        mongooseSchema.statics[method.name] = method.fn;
      }

      this._mongooseOptions.mongooseSchema  = mongooseSchema;
      this._mongooseOptions.initialized     = true;
      return this._mongooseOptions;
    }

    static $register<D extends Document, M>(
      mongooseInstance?: Mongoose
    ): Model<D> & M {
      if (!mongooseInstance) {
        mongooseInstance = require('mongoose');
      }

      let model: (Model<D> & M) = mongooseInstance.model(
        this.name, this.$mongooseOptions().mongooseSchema
      ) as (Model<D> & M);
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

    static cast<D extends NModel>(): INModel<D> {
      return this as any as INModel<D>;
    }
  }

  /**
   * Configuration for NModel.
   */
  export interface NModelConfig extends SchemaOptions {
    discriminatorKey?: string
  }

  /**
   * Mongoose options for current model.
   */
  export interface MongooseOptions {
    initialized:     boolean
    config:          NModelConfig
    schema?:         {}
    mongooseSchema?: Schema
    pres?:           Pre[]
    posts?:          Post[]
    virtuals?:       Virtual[]
    methods?:        Method[]
    statics?:        Method[]
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

  export class NativeError extends global.Error {}
}
