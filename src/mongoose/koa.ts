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
      let rModel   = self;
      const omits  = _.union([ '_id' ], options.omits, self.schema.api.AUTOGEN);
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

        if (!options.allowCreateFromParentModel && !modelName) {
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

      (ctx as any)[options.target] = doc;

      if (options.triggerNext) {
        await next();
      }

      doc = (ctx as any)[options.target];
      let object: KoaMiddlewares = (
        await rModel.create(doc)
      ) as any as KoaMiddlewares;

      if (options.project || options.level) {
        object = await self.findById(object._id, options.project, {
          level: options.level,
        });
      }

      (ctx as any)[options.target] = object;
      if (options.populate) {
        await rModel.populate(object, options.populate);
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

  public static getMiddleware(options: GetOptions): IMiddleware {
    const self = this.cast<KoaMiddlewares>();

    _.defaults(options, DEFAULT_COMMON_OPTIONS);

    async function get(ctx: IRouterContext, next: INext) {
      const query             = ctx.overrides && ctx.overrides.query || {};
      query._id               = ctx.params[options.field];
      const queryOption: any  = {};

      if (options.level) {
        queryOption.level = options.level;
      }

      let queryPromise  = self.findOne(query, options.project, queryOption);

      if (options.populate) {
        queryPromise    = queryPromise.populate(options.populate);
      }

      const object = await queryPromise;

      (ctx as any)[options.target] = object;

      if (options.triggerNext) {
        await next();
      }

      if (!options.nullable && object == null) {
        throw new NodesworkError('not found', {
          responseCode: 404,
        });
      }

      if (!options.noBody) {
        ctx.body = options.transform((ctx as any)[options.target]);
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
      const query             = ctx.overrides && ctx.overrides.query || {};
      const queryOption: any  = {};
      let pagination          = null;

      if (options.pagination) {
        // pagination       = VALIDATE_QUERY_PAGINATION(ctx.request.query);
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

      const object = await queryPromise;

      (ctx as any)[options.target] = object;

      if (options.triggerNext) {
        await next();
      }

      if (pagination) {
        const totalPage = Math.floor((
          await self.find(query).count() - 1
        ) / pagination.size + 1);
        ctx.response.set('total_page', totalPage.toString());
      }

      if (!options.noBody) {
        const body = (ctx as any)[options.target];
        for (let i = 0; i < body.length; i++) {
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

  public static updateMiddleware(options: UpdateOptions): IMiddleware {
    const self = this.cast<KoaMiddlewares>();

    _.defaults(options, DEFAULT_COMMON_OPTIONS);

    async function update(ctx: IRouterContext, next: INext) {
      const query             = ctx.overrides && ctx.overrides.query || {};
      query._id               = ctx.params[options.field];
      const queryOption: any  = {
        new:     true,
        fields:  options.project,
        level:   options.level,
      };
      const omits             = _.union(
        [ '_id' ], options.omits,
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

      const object = await rModel.findOneAndUpdate(query, upDoc, queryOption);

      (ctx as any)[options.target] = object;

      if (options.triggerNext) {
        await next();
      }

      if (!options.noBody) {
        const body = (ctx as any)[options.target];
        for (let i = 0; i < body.length; i++) {
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

  public static deleteMiddleware(options: DeleteOptions): IMiddleware {
    const self = this.cast<KoaMiddlewares>();

    _.defaults(options, DEFAULT_COMMON_OPTIONS);

    async function del(ctx: IRouterContext, next: INext) {
      const query             = ctx.overrides && ctx.overrides.query || {};
      query._id               = ctx.params[options.field];
      const queryOption: any  = {};

      const queryPromise      = self.findOne(query, undefined, queryOption);

      let object = await queryPromise;

      (ctx as any)[options.target] = object;

      if (options.triggerNext) {
        await next();
      }

      object = (ctx as any)[options.target];

      if (!options.nullable && object == null) {
        throw new NodesworkError('not found', {
          responseCode: 404,
        });
      }

      if (object) {
        await (object as any).delete();
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
  transform?:   (a: any) => Promise<any>;
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
