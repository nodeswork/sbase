import 'reflect-metadata';

import * as Router from 'koa-router';
import * as _ from 'underscore';

import { compose } from './utils';

import {
  IHandlerOptions,
  IMetadata,
  METADATA_KEY,
  Method,
} from './declarations';
import { ParamsOptions, params } from './params';
import { overrides } from './overrides';

export function Config(options: Router.IRouterOptions) {
  return (cls: any) => {
    const meta: IMetadata = Reflect.getMetadata(METADATA_KEY, cls) || {
      middlewares: [],
      handlers: {},
      routerOptions: {},
    };

    _.extend(meta.routerOptions, options);

    Reflect.defineMetadata(METADATA_KEY, meta, cls);
  };
}

export function Handler(options: IHandlerOptions = {}): PropertyDecorator {
  return (target: any, propertyKey: string) => {
    const cls = target.constructor;

    const meta: IMetadata = Reflect.getMetadata(METADATA_KEY, cls) || {
      middlewares: [],
      handlers: {},
      routerOptions: {},
    };

    if (meta.handlers[propertyKey] == null) {
      meta.handlers[propertyKey] = {
        method: Method.GET,
        path: '/',
        middleware: null,
      };
    }

    if (options.method) {
      meta.handlers[propertyKey].method = options.method;
    }

    if (options.path) {
      meta.handlers[propertyKey].path = options.path;
    }

    Reflect.defineMetadata(METADATA_KEY, meta, cls);
  };
}

export function Get(
  path: string,
  options: IHandlerOptions = {},
): PropertyDecorator {
  return Handler(
    _.extend({}, options, {
      path,
      method: Method.GET,
    }),
  );
}

export function Post(
  path: string,
  options: IHandlerOptions = {},
): PropertyDecorator {
  return Handler(
    _.extend({}, options, {
      path,
      method: Method.POST,
    }),
  );
}

export function Put(
  path: string,
  options: IHandlerOptions = {},
): PropertyDecorator {
  return Handler(
    _.extend({}, options, {
      path,
      method: Method.PUT,
    }),
  );
}

export function Delete(
  path: string,
  options: IHandlerOptions = {},
): PropertyDecorator {
  return Handler(
    _.extend({}, options, {
      path,
      method: Method.DELETE,
    }),
  );
}

export function Middleware(
  middlewares: Router.IMiddleware | Router.IMiddleware[],
): ClassDecorator & PropertyDecorator {
  middlewares = _.flatten([middlewares]);

  return (
    target: any,
    propertyKey?: string,
    descriptor?: TypedPropertyDescriptor<Router.IMiddleware>,
  ) => {
    if (propertyKey == null) {
      buildConstructorMiddleware(target, middlewares as Router.IMiddleware[]);
    } else {
      buildPropertyMiddleware(
        target,
        propertyKey,
        middlewares as Router.IMiddleware[],
        descriptor,
      );
    }
  };
}

function buildConstructorMiddleware(
  cls: any,
  middlewares: Router.IMiddleware[],
) {
  const meta: IMetadata = _.clone(
    Reflect.getMetadata(METADATA_KEY, cls) || {
      middlewares: [],
      handlers: {},
      routerOptions: {},
    },
  );

  meta.middlewares = _.union(middlewares, meta.middlewares);

  Reflect.defineMetadata(METADATA_KEY, meta, cls);
}

function buildPropertyMiddleware(
  target: any,
  propertyKey: string,
  middlewares: Router.IMiddleware[],
  descriptor: TypedPropertyDescriptor<Router.IMiddleware>,
) {
  const cls = target.constructor;
  const meta: IMetadata = _.clone(
    Reflect.getMetadata(METADATA_KEY, cls) || {
      middlewares: [],
      handlers: {},
      routerOptions: {},
    },
  );

  if (meta.handlers[propertyKey] == null) {
    meta.handlers[propertyKey] = {
      method: Method.GET,
      path: '/',
      middleware: null,
    };
  }

  if (descriptor != null) {
    descriptor.value = compose(middlewares.concat(descriptor.value));
  } else {
    const m = meta.handlers[propertyKey];

    if (m.middleware == null) {
      m.middleware = compose(middlewares);
    } else {
      m.middleware = compose(middlewares.concat(m.middleware));
    }
  }

  Reflect.defineMetadata(METADATA_KEY, meta, cls);
}

export const Overrides = (...rules: string[]) => {
  return Middleware(overrides(...rules));
};

export const Params = (options: ParamsOptions) => {
  return Middleware(params(options));
};
