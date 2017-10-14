declare module 'koa' {
  export interface Request {
    body: any;
  }
}

declare module 'koa-router' {
  export interface IRouterContext {
    overrides?:   IOverwrites;
  }
}

// Overwrite mongoose Schema.
declare module 'mongoose' {

  interface SchemaOptions {
    discriminatorKey?: string;
    dataLevel?:        DataLevelConfig;
  }

  interface Schema {
    dataLevel?:           {
      levelMap:           { [name: string]: string[] },
    };
    parentSchema?:        Schema;
    options?:             SchemaOptions;
    api:                  {
      READONLY:           string[];
      AUTOGEN:            string[];
      [name:  string]:    string[];
    };
  }

  interface SchemaType {
    options?:      SchemaTypeOptions;
  }

  interface DocumentToObjectOptions {
    level?:        string;
  }
}

export interface IOverwrites {
  query?:       { [name: string]: any };
  pagination?:  {
    page:       number;
    size:       number;
  };
  doc?:         any;
  sort?:        any;
}

export interface SchemaTypeOptions {
  api?: string;
}

/**
 * Configuration for dataLevel.
 */
export interface DataLevelConfig {
  levels:     string[];
  default?:   string;
}

export interface ToJSONOption {
  level?:     string;
}
