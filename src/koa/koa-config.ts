import * as _ from 'underscore';
import * as Router from 'koa-router';

export interface SBaseKoaConfig {
  middlewareMapper: (m: Router.IMiddleware) => Router.IMiddleware;
}

export const sbaseKoaConfig: SBaseKoaConfig = {
  middlewareMapper: _.identity,
};
