import * as _ from 'underscore'
import * as Router from 'koa-router'
import { ModelPopulateOptions } from 'mongoose'

import { CreateOptions, GetOptions } from '../mongoose/koa'
import { NModelType } from '../mongoose/nmodel'

var r: NRouter;

export class NRouter extends Router {

  nModel<T extends NModelType>(model: T, options: KoaNModelOptions): NRouter {
    return this;
  }
}

export interface KoaNModelOptions {

  vPrefix?:     string
  prefix?:      string

  field:        string
  nullable?:    boolean

  level?:       string    // the data level for projection
  project?:     string[]  // the data fields for projection

  // populate specific fields only
  populate?:    ModelPopulateOptions | ModelPopulateOptions[]

  // omits fields to be modified
  omits?:       string[]

  // transform the result before write to body
  transform?:   (a: any) => Promise<any>

  // if allows to create from parent model when there's discriminator config
  allowCreateFromParentModel?: boolean

  middlewares?: {
    [name: string]: MiddlwareValue
  }

  use?:         Router.IMiddleware | Router.IMiddleware[]
  postUse?:     Router.IMiddleware | Router.IMiddleware[]

  cruds?:       {
    create?:    boolean | KoaNModelCreateOptions,
    get?:       boolean | KoaNModelGetOptions,
    find?:      boolean | KoaNModelFindOptions,
    update?:    boolean | KoaNModelUpdateOptions,
    delete?:    boolean | KoaNModelDeleteOptions,
  }
  methods?:     {
    [name: string]: boolean | KoaNModelMethodOptions,
  }

  statics?:     {
    [name: string]: boolean | KoaNModelMethodOptions,
  }
}

export interface KoaNModelMethodOptions {
  use?:         Router.IMiddleware | Router.IMiddleware[]
  postUse?:     Router.IMiddleware | Router.IMiddleware[]
}

export interface KoaNModelCreateOptions extends KoaNModelMethodOptions {
}

export interface KoaNModelGetOptions extends KoaNModelMethodOptions {
}

export interface KoaNModelFindOptions extends KoaNModelMethodOptions {
}

export interface KoaNModelUpdateOptions extends KoaNModelMethodOptions {
}

export interface KoaNModelDeleteOptions extends KoaNModelMethodOptions {
}

export type SingleMiddleware = Router.IMiddleware | object
export type ListMiddleware = SingleMiddleware[]
export type MiddlwareValue = SingleMiddleware | ListMiddleware | ListMiddleware[]

const DEFAULT_KOA_NMODEL_OPTIONS = {
  vPrefix:      '',
  prefix:       '/',
  transform:    _.identity,
}
