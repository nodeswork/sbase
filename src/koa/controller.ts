import 'reflect-metadata';

import * as _ from 'underscore';
import * as Router from 'koa-router';
import * as compose from 'koa-compose';

import { IMetadata, METADATA_KEY } from './declarations';

export class A7Controller {
  private $router: Router;

  get $koaRouter(): Router {
    if (this.$router != null) {
      return this.$router;
    }

    const constructor = this.constructor;

    const meta: IMetadata = Reflect.getMetadata(METADATA_KEY, constructor);

    if (meta == null) {
      return null;
    }

    this.$router = new Router(meta.routerOptions);

    for (const middleware of meta.middlewares) {
      this.$router.use(middleware);
    }

    for (const handler in meta.handlers) {
      const handlerMeta = meta.handlers[handler];

      let method = (this as any)[handler];
      if (method != null) {
        method = _.bind(method, this);
      } else {
        method = _.identity;
      }

      if (handlerMeta.middleware != null) {
        method = compose([handlerMeta.middleware, method]);
        (this as any)[handler] = method;
      }

      (this.$router as any)[handlerMeta.method](
        handlerMeta.path,
        method,
      );
    }

    return this.$router;
  }

  get $koaRouterUseArgs(): [Router.IMiddleware, Router.IMiddleware] {
    return [this.$koaRouter.routes(), this.$koaRouter.allowedMethods()];
  }
}
