import { validator2 } from '@nodeswork/utils'
import { Schema } from 'mongoose'

export interface MongooseOptions {
  mongooseSchema: Schema
}

export interface NodesworkMongooseSchemaClass {

  new(): NodesworkMongooseSchema

  Config(): NodesworkMongooseSchemaClass

  Schema(schema: object): NodesworkMongooseSchemaClass

  Plugin(): NodesworkMongooseSchemaClass

  Index(): NodesworkMongooseSchemaClass

  Virtual(): NodesworkMongooseSchemaClass

  Pre(): NodesworkMongooseSchemaClass

  Post(): NodesworkMongooseSchemaClass

  MongooseOptions(): MongooseOptions

  MongooseSchema(): Schema
}

export class NodesworkMongooseSchema {

  static Config(): NodesworkMongooseSchemaClass {
    return this;
  }

  static Schema(schema: object): NodesworkMongooseSchemaClass {
    this.$SCHEMA = schema;
    return this;
  }

  static Plugin(): NodesworkMongooseSchemaClass {
    return this;
  }

  static Index(): NodesworkMongooseSchemaClass {
    return this;
  }

  static Virtual(): NodesworkMongooseSchemaClass {
    return this;
  }

  static Pre(): NodesworkMongooseSchemaClass {
    return this;
  }

  static Post(): NodesworkMongooseSchemaClass {
    return this;
  }

  static MongooseOptions(): MongooseOptions {
    if ('_mongooseOptions' in Object.getOwnPropertyNames(this)) {
      return this._mongooseOptions;
    }

    const validateSchema = validator2.isRequired({
      message: '$SCHEMA is missing',
      meta: {
        schemaClass: this.name
      }
    });

    validateSchema(this.$SCHEMA);

    var mongooseSchema: Schema = this.$SCHEMA as Schema;

    this._mongooseOptions = {
      mongooseSchema
    };

    return this._mongooseOptions;
  }

  static MongooseSchema(): Schema {

    return this.MongooseOptions().mongooseSchema;
  }

  static $SCHEMA: object;
  static _mongooseOptions: MongooseOptions;
}

NodesworkMongooseSchema
  .Config()
  .Schema({})
