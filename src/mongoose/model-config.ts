import { SchemaOptions } from 'mongoose';

declare module 'koa' {
  export interface Request {
    body: any;
  }
}

// Overwrite mongoose Schema.
declare module 'mongoose' {

  interface Schema {
    dataLevel?:    {
      levelMap:    { [name: string]: string[] },
    },
    parentSchema?: Schema
    options?:      ModelConfig
    api: {
      READONLY:       string[]
      AUTOGEN:        string[]
      [name: string]: string[]
    }
  }

  interface SchemaType {
    options?:      SchemaTypeOptions
  }

  interface DocumentToObjectOptions {
    level?:        string
  }
}

export interface SchemaTypeOptions {
  api?: string
}

/**
 * Configuration for Model.
 */
export interface ModelConfig extends SchemaOptions {
  discriminatorKey?: string;
  dataLevel?:        DataLevelConfig;
}

/**
 * Configuration for dataLevel.
 */
export interface DataLevelConfig {
  levels:     string[]
  default?:   string
}

export interface ToJSONOption {
  level?:     string
}
