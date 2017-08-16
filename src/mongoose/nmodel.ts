import * as _ from 'underscore'
import { validator2 } from '@nodeswork/utils'
import {
  Document, Model, Mongoose, Schema, SchemaOptions
} from 'mongoose'

export module mongoose {

  export interface NModel extends Document {}

  export var NModelType: new(...args: any[]) => NModelType
  export type NModelType = typeof NModel
  export type INModel<E extends NModel> = Model<E>

  export class NModel {

    // reflects the configuration for current model.
    static $CONFIG: NModelConfig;

    // preset the schema of current model.
    static $SCHEMA: {};

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

    static $mongooseOptions(): MongooseOptions {
      this._$initialize();
      if (this._mongooseOptions.initialized) {
        return this._mongooseOptions;
      }

      // const validateSchema = validator2.isRequired({
        // message: '$SCHEMA is missing',
        // meta: {
          // schemaClass: this.name
        // }
      // });

      // validateSchema(this.$SCHEMA);

      // TODO: expand fields from super class.
      this._mongooseOptions.schema = this.$SCHEMA;
      this._mongooseOptions.config = this.$CONFIG;

      var mongooseSchema = new Schema(
        this._mongooseOptions.schema, this._mongooseOptions.config
      );

      // mongooseSchema.pre

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
      if ('_mongooseOptions' in Object.getOwnPropertyNames(this)) {
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
  }
}
