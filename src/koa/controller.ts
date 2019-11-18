import 'reflect-metadata';

import * as _ from 'underscore';
import * as Router from 'koa-router';

import { compose } from './utils';

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

    if (_.isEmpty(meta.middlewares)) {
      this.$router.use(compose(meta.middlewares));
    }

    for (const handler in meta.handlers) {
      const handlerMeta = meta.handlers[handler];

      let method = (this as any)[handler] || _.identity;

      if (handlerMeta.middleware != null) {
        method = compose([handlerMeta.middleware, method]);
        (this as any)[handler] = method;
      }

      if (handlerMeta.path != null) {
        (this.$router as any)[handlerMeta.method](
          handlerMeta.path,
          method.bind(this),
        );
      }
    }

    return this.$router;
  }

  get $koaRouterUseArgs(): [Router.IMiddleware, Router.IMiddleware] {
    return [this.$koaRouter.routes(), this.$koaRouter.allowedMethods()];
  }
}
