import * as Router from 'koa-router';

const dotty = require('dotty');

export function overrides(...rules: string[]): Router.IMiddleware {
  const rs: Array<{ src: string[], dst: string[] }> = [];
  for (const rule of rules) {
    const [os, od] = rule.split('->');
    if (!od) {
      throw new Error(`Rule ${rule} is not correct`);
    }
    rs.push({ src: os.split('.'), dst: od.split('.') });
  }
  return async (ctx: Router.IRouterContext, next: () => void) => {
    for (const { src, dst } of rs) {
      const value = dotty.get(ctx, src);
      if (value !== undefined) {
        dotty.put(ctx.overrides, dst, value);
      }
    }
    await next();
  };
}
