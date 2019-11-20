import '../mongoose/model-config';

import * as Router from 'koa-router';
import * as _ from 'underscore';

import { withInheritedProps as dotty } from 'object-path';

export function overrides(...rules: OverrideRule[]): Router.IMiddleware {
  const rs: Array<{
    src: string[] | OverrideRuleExtractFn | object;
    dst: string[];
  }> = [];

  for (const rule of rules) {
    if (_.isString(rule)) {
      const [os, od] = rule.split('->');
      if (!od) {
        throw new Error(`Rule ${rule} is not correct`);
      }
      rs.push({ src: split(os), dst: split(od) });
    } else {
      const [os, od] = rule;
      rs.push({ src: os, dst: split(od) });
    }
  }

  return async (ctx: Router.IRouterContext, next: () => void) => {
    for (const { src, dst } of rs) {
      let value;

      if (_.isString(src)) {
        value = dotty.get(ctx, src);
      } else if (_.isFunction(src)) {
        value = src(ctx);
        if (value && (value as Promise<object>).then) {
          value = await value;
        }
      }

      if (value !== undefined) {
        dotty.set(ctx, ['overrides'].concat(dst), value);
      }
    }
    await next();
  };
}

export function clearOverrides(): Router.IMiddleware {
  return async (ctx: Router.IRouterContext, next: () => void) => {
    ctx.overrides = {
      query: {},
      doc: {},
    };
    await next();
  };
}

function split(str: string): string[] {
  const strs = str.split('.');
  for (let i = strs.length - 1; i >= 1; i--) {
    if (strs[i - 1].endsWith('\\')) {
      strs[i - 1] =
        strs[i - 1].substring(0, strs[i - 1].length - 1) + '.' + strs[i];
      strs[i] = '';
    }
  }

  return _.filter(strs, x => !!x);
}

export type OverrideRuleExtractFn = (
  ctx: Router.IRouterContext,
) => object | Promise<object>;

export type OverrideRule =
  | string
  | [object, string]
  | [OverrideRuleExtractFn, string];
