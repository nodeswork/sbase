import * as Router from 'koa-router';
import * as _ from 'underscore';

import * as validators from './validators';

import { withInheritedProps as dotty } from 'object-path';

export interface ParamError {
  path: string | number;
  value: any;
  failed: string;
  reason?: string;
}

export interface ParamsContext {
  errors?: ParamError[];
}

export interface ParamsOptions {
  [key: string]: null | validators.Validator | validators.Validator[];
}

export interface StandardParamsOptions {
  key: string;
  validators: validators.Validator[];
}

export function params(options: ParamsOptions): Router.IMiddleware {
  const mappedOptions: StandardParamsOptions[] = _.map(options, (v, key) => {
    const vs: validators.Validator[] = _.chain([v])
      .flatten()
      .filter(x => !!x)
      .value();

    if (key.startsWith('!')) {
      vs.push(validators.required);
      key = key.substring(1);
    }

    return { key, validators: vs };
  });

  return async (
    ctx: Router.IRouterContext & ParamsContext,
    next: () => void,
  ) => {
    ctx.errors = processValidators(ctx.request, mappedOptions, ctx);
    if (!_.isEmpty(ctx.errors)) {
      ctx.body = { errors: ctx.errors };
      ctx.status = 422;
    } else {
      await next();
    }
  };
}

export function processValidators(
  target: any,
  standardOptions: StandardParamsOptions[],
  root: any,
): ParamError[] {
  const errors = [];
  for (const o of standardOptions) {
    const newTarget = o.key.startsWith('~') ? root : target;
    const key = o.key.startsWith('~') ? o.key.substring(1) : o.key;

    for (const fn of o.validators) {
      const value = dotty.get(newTarget, key);
      const pass = fn(newTarget, key, value, root);
      if (pass === false || _.isString(pass)) {
        errors.push({
          path: o.key,
          value,
          failed: fn.name,
          reason: pass || '',
        });
      }

      if (_.isArray(pass)) {
        for (const error of pass) {
          errors.push({
            path: o.key + '.' + error.path,
            value: error.value,
            failed: fn.name + '>' + error.failed,
            reason: error.reason,
          });
        }
      }
    }
  }

  return errors;
}
