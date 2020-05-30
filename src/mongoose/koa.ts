import * as _ from 'underscore';
import { IMiddleware, IRouterContext } from 'koa-router';
import { ModelPopulateOptions, Schema, SchemaType } from 'mongoose';
import { NodesworkError } from '@nodeswork/utils';
import { withInheritedProps as dotty } from 'object-path';

import * as model from './model';
import * as validators from '../koa/validators';
import { Field } from './';
import { params } from '../koa/params';

export const READONLY = 'READONLY';
export const AUTOGEN = 'AUTOGEN';

export type KoaMiddlewaresType = typeof KoaMiddlewares;
export class KoaMiddlewares extends model.DocumentModel {
  public static createMiddleware(options: CreateOptions): IMiddleware {
    const self = this.cast<KoaMiddlewares>();

    _.defaults(options, DEFAULT_COMMON_OPTIONS);

    async function create(ctx: IRouterContext, next: INext) {
      const opts = _.extend(
        {},
        options,
        ctx.overrides && ctx.overrides.options,
      );
      const rModel = self;
      const omits = _.union(['_id'], opts.omits, self.schema.api.AUTOGEN);
      let doc = _.omit(ctx.request.body, omits);
      doc = _.extend(doc, ctx.overrides && ctx.overrides.doc);

      (ctx as any)[opts.target] = doc;

      if (opts.triggerNext) {
        await next();
      }

      doc = (ctx as any)[opts.target];
      let object: KoaMiddlewares = ((await rModel.create(
        doc,
      )) as any) as KoaMiddlewares;

      if (opts.project || opts.level) {
        object = await self.findById(
          object._id,
          opts.project,
          _.pick(opts, 'level', 'lean'),
        );
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

  /**
   * Returns Koa get middleware.
   *
   * Examples:
   *
   * 1. Load from ctx.params.  This is the most common case where the url path
   *    stores the model id.
   *
   *    @Post('/articles/:articleId')
   *    getArticle = models.Article.getMiddleware({ field: 'articleId' });
   *
   * 2. Load from ctx.request.
   *
   *    // When there is a dot in the field path, it will load from ctx.request.
   *    @Middleware(models.Article.getMiddleware({ field: 'body.articleId' }));
   *
   * 3. No need to specify id.
   *    // Pass a star.
   *    @Middleware(models.Article.getMiddleware({ field: '*' }));
   *
   * @param options.field specifies which field to load the id key value.
   * @param options.idFieldName specifies the field name in query.
   *                            Default: '_id'.
   * @param options.target specifies which field under ctx to set the target.
   *                       Default: 'object'.
   * @param options.triggerNext specifies whether to trigger next middleware.
   *                            Default: false.
   * @param options.transform a map function before send to ctx.body.
   */
  public static getMiddleware(options: GetOptions): IMiddleware {
    const self = this.cast<KoaMiddlewares>();

    options = _.defaults({}, options, DEFAULT_GET_OPTIONS);

    const idFieldName = options.idFieldName;

    async function get(ctx: IRouterContext, next: INext) {
      const opts = _.extend(
        {},
        options,
        ctx.overrides && ctx.overrides.options,
      );
      const query = (ctx.overrides && ctx.overrides.query) || {};
      if (opts.field !== '*') {
        if (opts.field.indexOf('.') >= 0) {
          query[idFieldName] = dotty.get(ctx.request, opts.field);
        } else {
          query[idFieldName] = ctx.params[opts.field];
        }

        if (query[idFieldName] == null) {
          throw new NodesworkError('invalid value', {
            responseCode: 422,
            path: opts.field,
            idFieldName,
          });
        }
      }
      if (Object.keys(query).length === 0) {
        throw new NodesworkError('no query parameters', {
          responseCode: 422,
          path: opts.field,
        });
      }

      const queryOption: any = _.pick(opts, 'level', 'lean');

      let queryPromise = self.findOne(query, opts.project, queryOption);

      if (opts.populate) {
        queryPromise = queryPromise.populate(opts.populate);
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

  /**
   * Returns KOA find middleware.
   *
   * Examples:
   *
   * 1. Normal query.
   *
   *    @Get('/articles')
   *    find = models.Article.findMiddleware();
   *
   * 2. Pagination.  User query.size, query.page to calculate numbers to skip.
   *
   *    @Get('/articles')
   *    find = models.Article.findMiddleware({
   *      pagination: {
   *        size: 50,  // single page size
   *        sizeChoices: [50, 100, 200],
   *        // where to store the full IPaginationData<any>.
   *        target: 'articlesWithPagination',
   *      },
   *    })
   *
   *  @param options.pagination.size specifies max number of returning records.
   *  @param options.pagination.sizeChoices
   *  @param options.pagination.target specifies where to store the full data.
   *  @param options.sort specifies the returning order.
   *  @param options.level specifies the data level.
   *  @param options.project specifies the projection.
   *  @param options.populate specifies the populates.
   */
  public static findMiddleware(options: FindOptions = {}): IMiddleware {
    const self = this.cast<KoaMiddlewares>();

    _.defaults(options, DEFAULT_COMMON_OPTIONS);

    if (options.pagination) {
      _.defaults(options.pagination, DEFAULT_FIND_PAGINATION_OPTIONS);
    }

    const defaultPagination = {
      page: 0,
      size: options.pagination ? options.pagination.size : 0,
    };

    const paginationParams =
      options.pagination &&
      params({
        'query.page': [validators.toInt()],
        'query.size': [
          validators.toInt(),
          validators.isEnum(options.pagination.sizeChoices),
        ],
      });

    async function find(ctx: IRouterContext, next: INext) {
      const opts = _.extend(
        {},
        options,
        ctx.overrides && ctx.overrides.options,
      );
      const query = (ctx.overrides && ctx.overrides.query) || {};
      const queryOption: any = _.pick(opts, 'sort', 'lean', 'level');
      let pagination = null;

      if (opts.pagination) {
        await paginationParams(ctx, () => null);
        if (ctx.status === 422) {
          return;
        }

        pagination = ctx.request.query;
        _.defaults(pagination, defaultPagination);

        queryOption.skip = pagination.page * pagination.size;
        queryOption.limit = pagination.size;
      }

      if (ctx.overrides && ctx.overrides.sort) {
        queryOption.sort = ctx.overrides.sort;
      }

      let queryPromise = self.find(query, opts.project, queryOption);

      if (opts.populate) {
        queryPromise = queryPromise.populate(opts.populate);
      }

      const object = await queryPromise;

      (ctx as any)[opts.target] = object;

      const bodyTarget: any =
        pagination == null
          ? object
          : {
              pageSize: pagination.size,
              page: pagination.page,
              total: await self.find(query).countDocuments(),
              data: object,
            };

      if (pagination && pagination.target) {
        (ctx as any)[pagination.target] = bodyTarget;
      }

      if (opts.triggerNext) {
        await next();
      }

      if (!opts.noBody) {
        const objects = (ctx as any)[opts.target];
        for (let i = 0; i < objects.length; i++) {
          objects[i] = await opts.transform(objects[i], ctx);
        }

        if (pagination && pagination.target) {
          bodyTarget.data = objects;
        }

        ctx.body = bodyTarget;
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

    options = _.defaults({}, options, DEFAULT_UPDATE_OPTIONS);

    const idFieldName = options.idFieldName;

    async function update(ctx: IRouterContext, next: INext) {
      const opts = _.extend(
        {},
        options,
        ctx.overrides && ctx.overrides.options,
      );
      const query = (ctx.overrides && ctx.overrides.query) || {};
      if (opts.field !== '*') {
        if (opts.field.indexOf('.') >= 0) {
          query[idFieldName] = dotty.get(ctx.request, opts.field);
        } else {
          query[idFieldName] = ctx.params[opts.field];
        }

        if (query[idFieldName] == null) {
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

      const queryOption: any = {
        new: true,
        fields: opts.project,
        level: opts.level,
        runValidators: true,
        context: 'query',
        lean: opts.lean,
      };
      const omits = _.union(
        ['_id'],
        [idFieldName],
        opts.omits,
        self.schema.api.READONLY,
        self.schema.api.AUTOGEN,
      );

      const fOmits = _.filter(Object.keys(ctx.request.body), (k) => {
        return _.find(omits, (o) => o === k || k.startsWith(o + '.')) != null;
      });

      let doc = _.omit(ctx.request.body, fOmits);
      doc = _.extend(doc, ctx.overrides && ctx.overrides.doc);
      const upDoc = {
        $set: doc,
      };
      let updatePromise = self.findOneAndUpdate(query, upDoc, queryOption);

      if (opts.populate) {
        updatePromise = updatePromise.populate(opts.populate);
      }
      const object = await updatePromise;

      if (object == null) {
        throw NodesworkError.notFound();
      }

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

    options = _.defaults({}, options, DEFAULT_DELETE_OPTIONS);
    const idFieldName = options.idFieldName;

    async function del(ctx: IRouterContext, next: INext) {
      const opts = _.extend(
        {},
        options,
        ctx.overrides && ctx.overrides.options,
      );
      const query = (ctx.overrides && ctx.overrides.query) || {};

      if (opts.field.indexOf('.') >= 0) {
        query[idFieldName] = dotty.get(ctx.request, opts.field);
      } else {
        query[idFieldName] = ctx.params[opts.field];
      }

      const queryOption: any = {};

      const queryPromise = self.findOne(query, undefined, queryOption);

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
  noBody?: boolean; // if to write the result to body
  triggerNext?: boolean; // if to trigger next middleware

  // the target field name write to ctx, default: object
  target?: string;

  lean?: boolean;

  // transform the result before write to body
  transform?: (a: any, ctx: IRouterContext) => any | Promise<any>;
}

const DEFAULT_COMMON_OPTIONS = {
  target: 'object',
  transform: _.identity,
};

const DEFAULT_SINGLE_ITEM_OPTIONS: Partial<SingleItemOptions> = {
  idFieldName: '_id',
  nullable: false,
};

const DEFAULT_GET_OPTIONS: Partial<GetOptions> = _.defaults(
  {},
  DEFAULT_COMMON_OPTIONS,
  DEFAULT_SINGLE_ITEM_OPTIONS,
);

const DEFAULT_UPDATE_OPTIONS: Partial<UpdateOptions> = _.defaults(
  {},
  DEFAULT_COMMON_OPTIONS,
  DEFAULT_SINGLE_ITEM_OPTIONS,
);

const DEFAULT_DELETE_OPTIONS: Partial<DeleteOptions> = _.defaults(
  {},
  DEFAULT_COMMON_OPTIONS,
  DEFAULT_SINGLE_ITEM_OPTIONS,
);

const DEFAULT_FIND_PAGINATION_OPTIONS = {
  size: 20,
  sizeChoices: [20, 50, 100, 200],
};

export interface CommonResponseOptions {
  level?: string; // the data level for projection
  project?: string[]; // the data fields for projection

  // populate specific fields only
  populate?: ModelPopulateOptions | ModelPopulateOptions[];
}

export interface CommonReadOptions {}

export interface CommonWriteOptions {
  omits?: string[]; // omits fields to be modified
}

export interface CreateOptions
  extends CommonOptions,
    CommonResponseOptions,
    CommonWriteOptions {}

/**
 * When read/write/delete to a single item.
 */
export interface SingleItemOptions {
  // The field name to extract.
  field: string;

  // The field where stores the id, default: _id.
  idFieldName?: string;

  // When a null value is acceptable, default: false.
  nullable?: boolean;
}

/**
 * Get Middleware Options.
 */
export interface GetOptions
  extends CommonOptions,
    CommonResponseOptions,
    CommonReadOptions,
    SingleItemOptions {}

export interface FindOptions
  extends CommonOptions,
    CommonResponseOptions,
    CommonReadOptions {
  pagination?: {
    size?: number;
    sizeChoices?: number[];
    target?: string;
  };

  sort?: object;
}

export interface UpdateOptions
  extends CommonOptions,
    CommonResponseOptions,
    CommonWriteOptions,
    SingleItemOptions {}

export interface DeleteOptions extends CommonOptions, SingleItemOptions {}

KoaMiddlewares.Plugin({
  fn: apiLevel,
});

function apiLevel(schema: Schema, _options: object) {
  for (let s = schema; s; s = s.parentSchema) {
    if (s.api == null) {
      s.api = {
        READONLY: [],
        AUTOGEN: [],
      };
    }
  }

  schema.eachPath((pathname: string, schemaType: SchemaType) => {
    if ([READONLY, AUTOGEN].indexOf(schemaType.options.api) < 0) {
      return;
    }
    for (let s = schema; s != null; s = s.parentSchema) {
      s.api[schemaType.options.api] = _.union(s.api[schemaType.options.api], [
        pathname,
      ]);
    }
  });
}

export type INext = () => Promise<any>;

export function Autogen(schema: any = {}) {
  return Field(
    _.extend({}, schema, {
      api: AUTOGEN,
    }),
  );
}

export function Readonly(schema: any = {}) {
  return Field(
    _.extend({}, schema, {
      api: READONLY,
    }),
  );
}

export interface PaginationData<T> {
  pageSize: number;
  page: number;
  total: number;
  data: T[];
}
