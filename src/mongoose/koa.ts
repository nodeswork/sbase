import * as _                                       from 'underscore';
import { IMiddleware, IRouterContext }              from 'koa-router';
import { ModelPopulateOptions, Schema, SchemaType } from 'mongoose';

import { NodesworkError, validator2 }               from '@nodeswork/utils';

import * as model                                   from './model';

export const READONLY = 'READONLY';
export const AUTOGEN  = 'AUTOGEN';

export type KoaMiddlewaresType = typeof KoaMiddlewares;
export class KoaMiddlewares extends model.Model {

  public static createMiddleware(options: CreateOptions): IMiddleware {
    const self = this.cast<KoaMiddlewares>();

    _.defaults(options, DEFAULT_COMMON_OPTIONS);

    async function create(ctx: IRouterContext, next: INext) {
      const opts   = _.extend(
        {}, options, ctx.overrides && ctx.overrides.options,
      );
      let rModel   = self;
      const omits  = _.union([ '_id' ], opts.omits, self.schema.api.AUTOGEN);
      let doc      = _.omit(ctx.request.body, omits);
      doc          = _.extend(doc, ctx.overrides && ctx.overrides.doc);

      const discriminatorKey: string = self.schema.options.discriminatorKey;

      if (discriminatorKey && discriminatorKey !== '__t') {
        const modelName = doc[discriminatorKey];

        if (modelName) {
          try {
            rModel = self.db.model(modelName);
          } catch (e) {
            /* handle error */
            rModel = null;
          }
        }

        if (!opts.allowCreateFromParentModel && !modelName) {
          throw new NodesworkError('required field is missing', {
            responseCode: 422,
            path: discriminatorKey,
          });
        }

        if (!rModel) {
          throw new NodesworkError('invalid value', {
            responseCode: 422,
            path: discriminatorKey,
          });
        }
      }

      (ctx as any)[opts.target] = doc;

      if (opts.triggerNext) {
        await next();
      }

      doc = (ctx as any)[opts.target];
      let object: KoaMiddlewares = (
        await rModel.create(doc)
      ) as any as KoaMiddlewares;

      if (opts.project || opts.level) {
        object = await self.findById(object._id, opts.project, {
          level: opts.level,
        });
      }

      (ctx as any)[opts.target] = object;
      if (opts.populate) {
        await rModel.populate(object, opts.populate);
      }

      if (!opts.noBody) {
        ctx.body = await opts.transform(object, ctx);
      }
    }

    Object.defineProperty(create, 'name', {
      value: `${self.modelName}#createMiddleware`,
      writable: false,
    });

    return create;
  }

  public static getMiddleware(options: GetOptions): IMiddleware {
    const self = this.cast<KoaMiddlewares>();

    _.defaults(options, DEFAULT_COMMON_OPTIONS);

    async function get(ctx: IRouterContext, next: INext) {
      const opts  = _.extend(
        {}, options, ctx.overrides && ctx.overrides.options,
      );
      const query = ctx.overrides && ctx.overrides.query || {};
      if (opts.field !== '*') {
        query._id = ctx.params[opts.field];
        if (query._id == null) {
          throw new NodesworkError('invalid value', {
            responseCode: 422,
            path: opts.field,
          });
        }
      }
      if (Object.keys(query).length === 0) {
        throw new NodesworkError('no query parameters', {
          responseCode: 422,
          path: opts.field,
        });
      }

      const queryOption: any  = {};
      if (opts.level) {
        queryOption.level = opts.level;
      }

      let queryPromise  = self.findOne(query, opts.project, queryOption);

      if (opts.populate) {
        queryPromise    = queryPromise.populate(opts.populate);
      }

      const object = await queryPromise;

      (ctx as any)[opts.target] = object;

      if (!opts.nullable && object == null) {
        throw NodesworkError.notFound();
      }

      if (opts.triggerNext) {
        await next();
      }

      if (!opts.noBody) {
        ctx.body = await opts.transform((ctx as any)[opts.target], ctx);
      }
    }

    Object.defineProperty(get, 'name', {
      value: `${self.modelName}#getMiddleware`,
      writable: false,
    });

    return get;
  }

  public static findMiddleware(options: FindOptions): IMiddleware {
    const self = this.cast<KoaMiddlewares>();

    _.defaults(options, DEFAULT_COMMON_OPTIONS);

    if (options.pagination) {
      _.defaults(options.pagination, DEFAULT_FIND_PAGINATION_OPTIONS);
    }

    const defaultPagination = {
      page: 0,
      size: options.pagination ? options.pagination.size : 0,
    };

    async function find(ctx: IRouterContext, next: INext) {
      const opts              = _.extend(
        {}, options, ctx.overrides && ctx.overrides.options,
      );
      const query             = ctx.overrides && ctx.overrides.query || {};
      const queryOption: any  = {};
      let pagination          = null;

      if (opts.pagination) {
        // pagination       = VALIDATE_QUERY_PAGINATION(ctx.request.query);
        pagination          = ctx.request.query;
        _.defaults(pagination, defaultPagination);

        queryOption.skip    = pagination.page * pagination.size;
        queryOption.limit   = pagination.size;
      }

      if (opts.sort) {
        queryOption.sort = opts.sort;
      }

      if (ctx.overrides && ctx.overrides.sort) {
        queryOption.sort = ctx.overrides.sort;
      }

      if (opts.level) {
        queryOption.level = opts.level;
      }

      let queryPromise  = self.find(query, opts.project, queryOption);

      if (opts.populate) {
        queryPromise    = queryPromise.populate(opts.populate);
      }

      const object = await queryPromise;

      (ctx as any)[opts.target] = object;

      if (opts.triggerNext) {
        await next();
      }

      if (pagination) {
        const totalPage = Math.floor((
          await self.find(query).count() - 1
        ) / pagination.size + 1);
        ctx.response.set('total_page', totalPage.toString());
      }

      if (!opts.noBody) {
        const body = (ctx as any)[opts.target];
        for (let i = 0; i < body.length; i++) {
          body[i] = await opts.transform(body[i], ctx);
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

  public static updateMiddleware(options: UpdateOptions): IMiddleware {
    const self = this.cast<KoaMiddlewares>();

    _.defaults(options, DEFAULT_COMMON_OPTIONS);

    async function update(ctx: IRouterContext, next: INext) {
      const opts  = _.extend(
        {}, options, ctx.overrides && ctx.overrides.options,
      );
      const query = ctx.overrides && ctx.overrides.query || {};
      if (opts.field !== '*') {
        query._id = ctx.params[opts.field];
        if (query._id == null) {
          throw new NodesworkError('invalid value', {
            responseCode: 422,
            path: opts.field,
          });
        }
      }
      if (Object.keys(query).length === 0) {
        throw new NodesworkError('no query parameters', {
          responseCode: 422,
          path: opts.field,
        });
      }

      const queryOption: any  = {
        new:            true,
        fields:         opts.project,
        level:          opts.level,
        runValidators:  true,
      };
      const omits             = _.union(
        [ '_id' ], opts.omits,
        self.schema.api.READONLY, self.schema.api.AUTOGEN,
      );
      let doc       = _.omit(ctx.request.body, omits);
      doc           = _.extend(doc, ctx.overrides && ctx.overrides.doc);
      const upDoc   = {
        $set: doc,
      };
      let rModel                     = self;
      const discriminatorKey: string = self.schema.options.discriminatorKey;
      const modelName                = ctx.request.body[discriminatorKey];

      if (discriminatorKey && modelName) {
        try {
          rModel = self.db.model(modelName);
          query[discriminatorKey] = modelName;
        } catch (e) {
          /* handle error */
        }
      }

      let updatePromise = rModel.findOneAndUpdate(query, upDoc, queryOption);

      if (opts.populate) {
        updatePromise = updatePromise.populate(opts.populate);
      }
      const object = await updatePromise;

      (ctx as any)[opts.target] = object;

      if (opts.triggerNext) {
        await next();
      }

      if (!opts.noBody) {
        ctx.body = await opts.transform((ctx as any)[opts.target], ctx);
      }
    }

    Object.defineProperty(update, 'name', {
      value: `${self.modelName}#updateMiddleware`,
      writable: false,
    });

    return update;
  }

  public static deleteMiddleware(options: DeleteOptions): IMiddleware {
    const self = this.cast<KoaMiddlewares>();

    _.defaults(options, DEFAULT_COMMON_OPTIONS);

    async function del(ctx: IRouterContext, next: INext) {
      const opts              = _.extend(
        {}, options, ctx.overrides && ctx.overrides.options,
      );
      const query             = ctx.overrides && ctx.overrides.query || {};
      query._id               = ctx.params[opts.field];
      const queryOption: any  = {};

      const queryPromise      = self.findOne(query, undefined, queryOption);

      let object = await queryPromise;

      (ctx as any)[opts.target] = object;

      object = (ctx as any)[opts.target];

      if (!opts.nullable && object == null) {
        throw new NodesworkError('not found', {
          responseCode: 404,
        });
      }

      if (object) {
        await object.remove();
      }

      if (opts.triggerNext) {
        await next();
      }

      ctx.status = 204;
    }

    Object.defineProperty(del, 'name', {
      value: `${self.modelName}#deleteMiddleware`,
      writable: false,
    });

    return del;
  }
}

export interface CommonOptions {

  noBody?:      boolean;          // if to write the result to body
  triggerNext?: boolean;          // if to trigger next middleware

  // the target field name write to ctx, default: object
  target?:      string;

  // transform the result before write to body
  transform?:   (a: any, ctx: IRouterContext) => Promise<any>;
}

const DEFAULT_COMMON_OPTIONS = {
  target:       'object',
  transform:    _.identity,
};

const DEFAULT_FIND_PAGINATION_OPTIONS = {
  size:         20,
  sizeChoices:  [20, 50, 100, 200],
};

const VALIDATE_QUERY_PAGINATION = validator2.compile({
  page: [],
  size: [],
});

export interface CommonResponseOptions {
  level?:       string;    // the data level for projection
  project?:     string[];  // the data fields for projection

  // populate specific fields only
  populate?:    ModelPopulateOptions | ModelPopulateOptions[];
}

export interface CommonReadOptions {
}

export interface CommonWriteOptions {
  omits?:       string[];  // omits fields to be modified
}

export interface CreateOptions extends CommonOptions, CommonResponseOptions,
  CommonWriteOptions {

  // if allows to create from parent model when there's discriminator config
  allowCreateFromParentModel?: boolean;
}

export interface GetOptions extends CommonOptions, CommonResponseOptions,
  CommonReadOptions {

  field:        string;
  nullable?:    boolean;
}

export interface FindOptions extends CommonOptions, CommonResponseOptions,
  CommonReadOptions {

  pagination?:  {
    size?:         number;
    sizeChoices?:  number[];
  };

  sort?: object;
}

export interface UpdateOptions extends CommonOptions, CommonResponseOptions,
  CommonWriteOptions {

  field:        string;
  nullable?:    boolean;
}

export interface DeleteOptions extends CommonOptions {
  field:        string;
  nullable?:    boolean;
}

KoaMiddlewares.Plugin({
  fn: apiLevel,
});

function apiLevel(schema: Schema, options: object) {
  if (schema.api == null) {
    schema.api = {
      READONLY:  [],
      AUTOGEN:   [],
    };
  }

  schema.eachPath((pathname: string, schemaType: SchemaType) => {
    if ([ READONLY, AUTOGEN ].indexOf(schemaType.options.api) < 0) {
      return;
    }
    for (let s = schema; s != null; s = s.parentSchema) {
      s.api[schemaType.options.api] = _.union(
        s.api[schemaType.options.api], [ pathname ],
      );
    }
  });
}

export type INext = () => Promise<any>;
