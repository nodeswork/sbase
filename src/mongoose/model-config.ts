import * as _ from 'underscore';
import { ConnectionOptions, Mongoose } from 'mongoose';

declare module 'koa' {
  export interface Request {
    body: any;
  }
}

declare module 'koa-router' {
  export interface IRouterContext {
    overrides?: IOverwrites;
  }
}

// Overwrite mongoose Schema.
declare module 'mongoose' {
  interface SchemaOptions {
    discriminatorKey?: string;
    dataLevel?: DataLevelConfig;
  }

  interface Schema {
    dataLevel?: {
      levelMap: { [name: string]: string[] };
    };
    parentSchema?: Schema;
    options?: SchemaOptions;
    api: {
      READONLY: string[];
      AUTOGEN: string[];
      [name: string]: string[];
    };
  }

  interface SchemaType {
    options?: SchemaTypeOptions;
  }
}

export interface IOverwrites {
  query?: { [name: string]: any };
  pagination?: {
    page: number;
    size: number;
  };
  doc?: any;
  sort?: any;
  options?: any;
}

export interface SchemaTypeOptions {
  api?: string;
}

/**
 * Configuration for dataLevel.
 */
export interface DataLevelConfig {
  levels: string[] | object;
  default?: string;
  _levelsMap?: { [level: string]: object };
}

export interface ToJSONOption {
  level?: string;
}

export interface MultiTenancyOptions {
  enabled?: boolean;
  defaultCollectionNamespace?: string;
  tenants?: string[];
  tenancyFn?: (prop: string) => string;
  uris?: string;
  options?: ConnectionOptions;
  onError?: (err: any, tenancy: string) => void;
  onMongooseInstanceCreated?: (mongoose: Mongoose, tenancy: string) => void;
}

export interface SBaseMongooseConfig {
  multiTenancy?: MultiTenancyOptions;
}

export const DEFAULT_MONGOOSE_MULTI_TENANCY_OPTIONS: MultiTenancyOptions = {
  enabled: false,
  defaultCollectionNamespace: '',
  tenants: [],
  tenancyFn: () => 'default',
  options: {},
  onError: () => {},
  onMongooseInstanceCreated: () => {},
};

export const sbaseMongooseConfig: SBaseMongooseConfig = {
  multiTenancy: _.clone(DEFAULT_MONGOOSE_MULTI_TENANCY_OPTIONS),
};

export function newMongooseInstance(
  sbaseConfig: SBaseMongooseConfig,
): Mongoose {
  const mongoose = new Mongoose();
  (mongoose as any).sbaseConfig = sbaseConfig;
  return mongoose;
}
