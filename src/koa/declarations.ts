import * as Router from 'koa-router';

export enum Method {
  GET = 'get',
  POST = 'post',
  PUT = 'put',
  DELETE = 'delete',
}

export interface IHandlerOptions {
  method?: Method;
  path?: string;
  name?: string;
}

export interface IMetadata {
  middlewares: Router.IMiddleware[];
  handlers: {
    [name: string]: IHandlerMetadata;
  };
  routerOptions: Router.IRouterOptions;
}

export interface IHandlerMetadata {
  method: Method;
  path: string;
  middleware: Router.IMiddleware;
  name?: string;
}

export const METADATA_KEY = 'a7:router-meta';
