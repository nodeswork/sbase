import * as _ from 'underscore'
import { IMiddleware, IRouterContext } from 'koa-router'
import { ModelPopulateOptions, Schema, SchemaType } from 'mongoose'

import { NodesworkError, validator2 } from '@nodeswork/utils'

import * as model from './model'

export type KoaMiddlewaresType = typeof KoaMiddlewares

declare module 'koa' {
  export interface Request {
    body: any;
  }
}

declare module 'mongoose' {
  interface Schema {
    api: {
      READONLY:       string[]
      AUTOGEN:        string[]
      [name: string]: string[]
    }
  }
}

export const READONLY = 'READONLY'
export const AUTOGEN  = 'AUTOGEN'

export class KoaMiddlewares extends model.Model {

  static createMiddleware(options: CreateOptions): IMiddleware {
    let self = this.cast<KoaMiddlewares>();

    _.defaults(options, DEFAULT_COMMON_OPTIONS);

    async function create(ctx: IContext, next: INext) {
      let model = self;

      let doc    = _.extend(
        {}, ctx.request.body, ctx.overrides && ctx.overrides.doc
      );
      let omits  = _.union(options.omits, self.schema.api.AUTOGEN);
      doc        = _.omit(doc, omits);

      (ctx as any)[options.target] = doc;

      if (options.triggerNext) {
        await next();
      }

      doc = (ctx as any)[options.target];
      let object: KoaMiddlewares = (
        await model.create(doc)
      ) as any as KoaMiddlewares;

      if (options.project || options.level) {
        object = await self.findById(object._id, options.project, {
          level: options.level,
        });
      }

      (ctx as any)[options.target] = object;
      if (options.populate) {
        await model.populate(object, options.populate);
      }

      if (!options.noBody) {
        ctx.body = options.transform(object);
      }
    }

    Object.defineProperty(create, 'name', {
      value: `${self.modelName}#createMiddleware`,
      writable: false,
    });

    return create;
  }

  static getMiddleware(options: GetOptions): IMiddleware {
    let self = this.cast<KoaMiddlewares>();

    _.defaults(options, DEFAULT_COMMON_OPTIONS);

    async function get(ctx: IContext, next: INext) {
      let query             = ctx.overrides && ctx.overrides.query || {};
      query._id             = ctx.params[options.field];
      let queryOption: any  = {};

      if (options.level) {
        queryOption.level = options.level;
      }

      let queryPromise  = self.findOne(query, options.project, queryOption);

      if (options.populate) {
        queryPromise    = queryPromise.populate(options.populate);
      }

      let object = await queryPromise;

      (ctx as any)[options.target] = object;

      if (options.triggerNext) {
        await next();
      }

      if (!options.nullable && object == null) {
        throw new NodesworkError('not found', {
          responseCode: 404
        });
      }

      if (!options.noBody) {
        ctx.body = options.transform((ctx as any)[options.target])
      }
    }

    Object.defineProperty(get, 'name', {
      value: `${self.modelName}#getMiddleware`,
      writable: false,
    });

    return get;
  }

  static findMiddleware(options: FindOptions): IMiddleware {
    let self = this.cast<KoaMiddlewares>();

    _.defaults(options, DEFAULT_COMMON_OPTIONS);

    if (options.pagination) {
      _.defaults(options.pagination, DEFAULT_FIND_PAGINATION_OPTIONS);
    }

    const defaultPagination = {
      page: 0,
      size: options.pagination ? options.pagination.size : 0,
    };

    async function find(ctx: IContext, next: INext) {
      let query             = ctx.overrides && ctx.overrides.query || {};
      let queryOption: any  = {};
      let pagination        = null;

      if (options.pagination) {
        // pagination          = VALIDATE_QUERY_PAGINATION(ctx.request.query);
        pagination          = ctx.request.query;
        _.defaults(pagination, defaultPagination);

        queryOption.skip    = pagination.page * pagination.size;
        queryOption.limit   = pagination.size;
      }

      if (options.level) {
        queryOption.level = options.level;
      }

      let queryPromise  = self.find(query, options.project, queryOption);

      if (options.populate) {
        queryPromise    = queryPromise.populate(options.populate);
      }

      let object = await queryPromise;

      (ctx as any)[options.target] = object;

      if (options.triggerNext) {
        await next();
      }

      if (pagination) {
        let totalPage = Math.floor((
          await self.find(query).count() - 1
        ) / pagination.size + 1);
        ctx.response.set('total_page', totalPage.toString());
      }

      if (!options.noBody) {
        let body = (ctx as any)[options.target];
        for (let i in body) {
          body[i] = options.transform(body[i]);
        }
        ctx.body = body;
      }
    }

    Object.defineProperty(find, 'name', {
      value: `${self.modelName}#findMiddleware`,
      writable: false,
    });

    return find;
  }

  static updateMiddleware(options: UpdateOptions): IMiddleware {
    let self = this.cast<KoaMiddlewares>();

    _.defaults(options, DEFAULT_COMMON_OPTIONS);

    async function update(ctx: IContext, next: INext) {
      let query             = ctx.overrides && ctx.overrides.query || {};
      query._id             = ctx.params[options.field];
      let queryOption: any  = {
        new:     true,
        fields:  options.project,
        level:   options.level,
      };
      let omits             = _.union(
        [ '_id' ], options.omits,
        self.schema.api.READONLY, self.schema.api.AUTOGEN
      );
      let update            = {
        $set: _.omit(ctx.request.body, omits),
      };

      var object = await self.findOneAndUpdate(query, update, queryOption);

      (ctx as any)[options.target] = object;

      if (options.triggerNext) {
        await next();
      }

      if (!options.noBody) {
        let body = (ctx as any)[options.target];
        for (let i in body) {
          body[i] = options.transform(body[i]);
        }
        ctx.body = body;
      }
    }

    Object.defineProperty(update, 'name', {
      value: `${self.modelName}#updateMiddleware`,
      writable: false,
    });

    return update;
  }

  static deleteMiddleware() {}
}

export interface CommonOptions {

  noBody?:      boolean          // if to write the result to body
  triggerNext?: boolean          // if to trigger next middleware

  // the target field name write to ctx, default: object
  target?:      string

  // transform the result before write to body
  transform?:   (a: any) => Promise<any>
}

const DEFAULT_COMMON_OPTIONS = {
  target:       'object',
  transform:    _.identity,
}

const DEFAULT_FIND_PAGINATION_OPTIONS = {
  size:         20,
  sizeChoices:  [20, 50, 100, 200],
}

const VALIDATE_QUERY_PAGINATION = validator2.compile({
  page: [],
  size: [],
});

export interface CommonResponseOptions {
  level?:       string    // the data level for projection
  project?:     string[]  // the data fields for projection

  // populate specific fields only
  populate?:    ModelPopulateOptions | ModelPopulateOptions[]
}

export interface CommonReadOptions {
}

export interface CommonWriteOptions {
  omits?:       string[]  // omits fields to be modified
}

export interface CreateOptions extends CommonOptions, CommonResponseOptions,
  CommonWriteOptions {

  noExtendion?: boolean   // not to use discriminitor models
}

export interface GetOptions extends CommonOptions, CommonResponseOptions,
  CommonReadOptions {

  field:        string
  nullable?:    boolean
}

export interface FindOptions extends CommonOptions, CommonResponseOptions,
  CommonReadOptions {

  pagination?:  {
    size?:         number
    sizeChoices?:  number[]
  }
}

export interface UpdateOptions extends CommonOptions, CommonResponseOptions,
  CommonWriteOptions {

  field:        string
  nullable?:    boolean
}

export interface IContext extends IRouterContext {
  overrides?:   IOverwrites
}

export interface IOverwrites {
  query?:       { [name: string]: any }
  pagination?:  {
    page:       number
    size:       number
  }
  doc?:         any
}

KoaMiddlewares.Plugin({
  fn: apiLevel,
});

declare module './model' {
  export interface SchemaTypeOptions {
    api?: string
  }
}

function apiLevel(schema: Schema, options: Object) {
  if (schema.api == null) {
    schema.api = {
      READONLY:  [],
      AUTOGEN:   []
    }
  }

  schema.eachPath(function (pathname: string, schemaType: SchemaType) {
    if ([ READONLY, AUTOGEN ].indexOf(schemaType.options.api) < 0) {
      return;
    }
    for (let s = schema; s != null; s = s.parentSchema) {
      s.api[schemaType.options.api] = _.union(
        s.api[schemaType.options.api], [ pathname ]
      );
    }
  });
}

export type INext = () => Promise<any>
