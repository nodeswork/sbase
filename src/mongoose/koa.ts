import * as model from './model'

export interface CommonOptions {

  writeToBody?: boolean

  target?:      string

  triggerNext?: boolean
}

export type KoaMiddlewaresType = typeof KoaMiddlewares

export class KoaMiddlewares extends model.Model {

  static createMiddleware() {}

  test() {}
}
