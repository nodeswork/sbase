import '../mongoose/model-config';

import * as Router from 'koa-router';
import * as _ from 'underscore';
import debug from 'debug';

const d = debug('sbase:overrides');

import { withInheritedProps as dotty } from 'object-path';

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
export function overrides(...rules: OverrideRule[]): Router.IMiddleware {
  const rs: {
    src: string[] | OverrideRuleExtractFn;
    dst: string[];
  }[] = [];

  for (const rule of rules) {
    if (_.isString(rule)) {
      const [os, od] = rule.split('->');
      if (!od) {
        throw new Error(`Rule ${rule} is not correct`);
      }
      rs.push({ src: split(os), dst: split(od) });
    } else {
      const [os, od] = rule;
      rs.push({ src: _.isFunction(os) ? os : () => os, dst: split(od) });
    }
  }

  d('Prepared overrides: %O', rs);

  return async (ctx: Router.IRouterContext, next: () => any) => {
    for (const { src, dst } of rs) {
      let value;

      if (_.isArray(src)) {
        value = dotty.get(ctx, src);
      } else if (_.isFunction(src)) {
        value = src(ctx);
        if (value && (value as Promise<object>).then) {
          value = await value;
        }
      }

      if (value !== undefined) {
        dotty.set(ctx, ['overrides'].concat(dst), value);
        d(
          'Set overrides %O with value %O, result: %O',
          dst,
          value,
          ctx.overrides,
        );
      }
    }
    await next();
  };
}

export function clearOverrides(): Router.IMiddleware {
  return async (ctx: Router.IRouterContext, next: () => any) => {
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
