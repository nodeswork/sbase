import * as _ from 'underscore'
import { IMiddleware, IRouterContext } from 'koa-router'
import { ModelPopulateOptions } from 'mongoose'

import { NodesworkError } from '@nodeswork/utils'

import * as model from './model'

export type KoaMiddlewaresType = typeof KoaMiddlewares

export class KoaMiddlewares extends model.Model {

  static createMiddleware(options: CreateOptions): IMiddleware {

    async function create(ctx: IContext, next: INext) {
    }

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

  static findMiddleware() {}

  static udpateMiddleware() {}

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

export interface IContext extends IRouterContext {
  overrides?:   IOverwrites
}

export interface IOverwrites {
  query?:       { [name: string]: any }
}

export type INext = () => Promise<any>
