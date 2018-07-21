import * as should from 'should';
import * as Router from 'koa-router';

import { params, required, ParamsContext, ltrim } from '../../src/koa';

describe('koa.params', () => {

  it('should validate require', async () => {
    const m = params({
      foo: required,
    });
    const ctx = getFakeContext({
    });
    await m(ctx, null);
    ctx.status.should.be.equal(422);
    ctx.errors.should.be.deepEqual([
      { path: 'foo', value: undefined, failed: 'required' },
    ]);
  });

  it('should validate require with exclamation mark', async () => {
    const m = params({
      '!foo': [],
    });
    const ctx = getFakeContext({
    });
    await m(ctx, null);
    ctx.status.should.be.equal(422);
    ctx.errors.should.be.deepEqual([
      { path: 'foo', value: undefined, failed: 'required' },
    ]);
  });

  it('should modified by ltrim', async () => {
    const m = params({
      '!query.foo': ltrim('a'),
    });
    const ctx = getFakeContext({
      query: {
        foo: 'aabbb',
      },
    });
    await m(ctx, () => null);
    ctx.errors.should.be.empty();
    ctx.request.query.foo.should.be.equal('bbb');
  });
});

function getFakeContext(request: any): Router.IRouterContext & ParamsContext {
  return {
    request,
  } as any;
}
