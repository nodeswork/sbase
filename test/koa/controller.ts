import * as should from 'should';

import { A7Controller, Middleware } from '../../src/koa';

class Controller extends A7Controller {
  @Middleware(async (ctx: any, next: () => void) => {
    ctx.values.push('m1');
    await next();
  })
  async m2(ctx: any, next: () => void) {
    ctx.values.push('m2');
    await next();
  }

  @Middleware(Controller.prototype.m2)
  @Middleware(async (ctx: any, next: () => void) => {
    ctx.values.push('m3');
    await next();
  })
  async m4(ctx: any, next: () => void) {
    ctx.values.push('m4');
    await next();
  }

  @Middleware(Controller.prototype.m4)
  m5 = async (ctx: any) => {
    ctx.values.push('m5');
  };
}

const controller = new Controller();

controller.$koaRouterUseArgs;

describe('koa.controller', () => {
  it('should create middlewares', async () => {
    const ctx: any = { values: [] };
    await controller.m4(ctx, function () {});
    ctx.values.should.deepEqual(['m1', 'm2', 'm3', 'm4']);
  });

  it('should create with empty middlewares', async () => {
    const ctx: any = { values: [] };
    await controller.m5(ctx);
    ctx.values.should.deepEqual(['m1', 'm2', 'm3', 'm4', 'm5']);
  });
});
