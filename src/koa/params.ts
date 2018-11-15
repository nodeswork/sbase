import * as Router from 'koa-router';
import * as _ from 'underscore';

import * as validators from './validators';

const dotty = require('dotty');

export interface ParamError {
  path:    string;
  value:   any;
  failed:  string;
}

export interface ParamsContext {
  errors?: ParamError[];
}

export interface ParamsOptions {
  [key: string]: validators.Validator | validators.Validator[];
}

export function params(options: ParamsOptions): Router.IMiddleware {
  const mappedOptions = _.map(options, (v, key) => {
    const vs: validators.Validator[] = _.flatten([v]);
    if (key.startsWith('!')) {
      vs.push(validators.required);
      key = key.substring(1);
    }
    return {key, validators: vs};
  });

  return async (
    ctx: Router.IRouterContext & ParamsContext, next: () => void,
  ) => {
    ctx.errors = [];
    for (const o of mappedOptions) {
      const value = dotty.get(ctx.request, o.key);
      for (const fn of o.validators) {
        const pass = fn(ctx, o.key, value);
        if (!pass) {
          ctx.errors.push({
            path: o.key,
            value,
            failed: fn.name,
          });
        }
      }
    }

    if (!_.isEmpty(ctx.errors)) {
      ctx.body = { errors: ctx.errors };
      ctx.status = 422;
    } else {
      await next();
    }
  };
}
