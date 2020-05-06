import 'reflect-metadata';

import * as Router from 'koa-router';
import * as _ from 'underscore';

import {
  IHandlerOptions,
  IMetadata,
  METADATA_KEY,
  Method,
} from './declarations';
import { OverrideRule, overrides } from './overrides';
import { ParamsOptions, params } from './params';

import { compose, isPromise } from './utils';
import { sbaseKoaConfig } from './koa-config';

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

    const m = meta.handlers[propertyKey];

    if (options.middleware) {
      const middleware = _.isArray(options.middleware)
        ? compose(options.middleware)
        : options.middleware;

      m.middleware =
        m.middleware == null ? middleware : compose([middleware, m.middleware]);
    }

    if (options.method) {
      m.method = options.method;
    }

    if (options.path) {
      m.path = options.path;
    }

    if (options.name) {
      m.name = options.name;
    }

    if (m.path == null) {
      m.path = '/';
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
  middlewares = _.chain([middlewares])
    .flatten()
    .map(sbaseKoaConfig.middlewareMapper)
    .value();

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

/**
 * A IF middleware that helps a branch checking.  Usage:
 *
 *     @If(predictor, ifClause)
 *     - execute ifClause when predictor returns true.
 *     - execute next middleware when predictor returns false.
 *
 *     @If(predictor, ifClause, elseClause)
 *     - execute ifClause when predictor returns true.
 *     - execute elseClause when predictor returns false.
 *
 * @param predictor - Predict which clause to execute.
 * @param ifClause - Execute when predictor returns true.
 * @param elseClause - Execute when predictor returns false. By default, execute
 *                     else clause.
 */
export function If(
  predictor: (ctx: Router.IRouterContext) => boolean | Promise<boolean>,
  ifClause: Router.IMiddleware,
  elseClause?: Router.IMiddleware,
) {
  return Middleware(async (ctx: Router.IRouterContext, next: () => any) => {
    const value = predictor(ctx);
    const boolValue = isPromise(value) ? await value : value;

    if (boolValue) {
      await ifClause(ctx, next);
    } else if (elseClause) {
      await elseClause(ctx, next);
    } else {
      await next();
    }
  });
}

/**
 * A WHEN middleware that helps a branch checking, next middleware will always
 * be executed regardless what predictor returns.
 *
 * @param predictor - Predict when the when clause will be executed.
 * @param whenClause - Execute when predictor returns true.
 */
export function When(
  predictor: (ctx: Router.IRouterContext) => boolean | Promise<boolean>,
  whenClause: Router.IMiddleware,
) {
  return Middleware(async (ctx: Router.IRouterContext, next: () => any) => {
    const value = predictor(ctx);
    const boolValue = isPromise(value) ? await value : value;

    if (boolValue && whenClause) {
      await whenClause(ctx, () => Promise.resolve({}));
    }

    await next();
  });
}

/**
 * A CHECK middleware that helps determines if to execute next middleware.
 * Usage:
 *
 *   @Check((ctx: Router.IRouterContext) => ctx.isAuthenticated())
 *
 * @param predictor - Returns true to execute next middleware.
 */
export function Check(
  predictor: (ctx: Router.IRouterContext) => boolean | Promise<boolean>,
) {
  return Middleware(async (ctx: Router.IRouterContext, next: () => any) => {
    const value = predictor(ctx);
    const boolValue = isPromise(value) ? await value : value;

    if (boolValue) {
      await next();
    }
  });
}

/**
 * A Tee middleware that helps execute a side function.
 * Usage:
 *
 *   @Tee((ctx: Router.IRouterContext) => console.log(ctx.path))
 *
 * @param fn - The side function to execute.
 * @param post - specifies run tee after returned.
 */
export function Tee(
  fn: (ctx: Router.IRouterContext, next: () => any) => void | Promise<void>,
  post?: boolean,
) {
  return Middleware(async (ctx: Router.IRouterContext, next: () => any) => {
    if (!post) {
      const value = fn(ctx, () => {});
      if (isPromise(value)) {
        await value;
      }
    }
    await next();
    if (post) {
      const value = fn(ctx, () => {});
      if (isPromise(value)) {
        await value;
      }
    }
  });
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
      path: null,
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

/**
 * Generate an overrides middleware to help build mongoose queries.
 *
 * 1. Fetch query params to override query:
 *    overrides('request.query.status->query.status')
 *    overrides('request.body.status->query.status')
 *
 * 2. Set object to override query:
 *    overrides(['constValue', 'query.status'])
 *
 * 3. Extract object from ctx:
 *    overrides([(ctx) =>
 *      moment(ctx.request.query.date).startOf('month').toDate(),
 *      'query.date',
 *    ])
 */
export const Overrides = (...rules: OverrideRule[]) => {
  return Middleware(overrides(...rules));
};

export const Params = (options: ParamsOptions) => {
  return Middleware(params(options));
};
