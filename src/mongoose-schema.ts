import { validator2 } from '@nodeswork/utils'

export interface NodesworkMongooseSchemaClass {

  new(): NodesworkMongooseSchema

  Config(): NodesworkMongooseSchemaClass

  Schema(schema: object): NodesworkMongooseSchemaClass

  Plugin(): NodesworkMongooseSchemaClass

  Index(): NodesworkMongooseSchemaClass

  Virtual(): NodesworkMongooseSchemaClass

  Pre(): NodesworkMongooseSchemaClass

  Post(): NodesworkMongooseSchemaClass

  MongooseSchema(): object
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

  static MongooseSchema(): object {
    const validateSchema = validator2.isRequired({
      message: '$SCHEMA is missing',
      meta: {
        schemaClass: this.name
      }
    });

    validateSchema(this.$SCHEMA);

    return {};
  }

  static $SCHEMA: object;
}

NodesworkMongooseSchema
  .Config()
  .Schema({})
