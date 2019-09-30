import '../mongoose/model-config';

import * as Router from 'koa-router';
import * as _ from 'underscore';

const dotty = require('dotty');

export function overrides(...rules: string[]): Router.IMiddleware {
  const rs: Array<{ src: string[]; dst: string[] }> = [];
  for (const rule of rules) {
    const [os, od] = rule.split('->');
    if (!od) {
      throw new Error(`Rule ${rule} is not correct`);
    }
    rs.push({ src: split(os), dst: split(od) });
  }
  return async (ctx: Router.IRouterContext, next: () => void) => {
    for (const { src, dst } of rs) {
      const value = dotty.get(ctx, src);
      if (value !== undefined) {
        dotty.put(ctx, ['overrides'].concat(dst), value);
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
