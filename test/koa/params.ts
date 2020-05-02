import * as Router from 'koa-router';

import { ParamsContext, params, validators } from '../../src/koa';
import { NodesworkError } from '@nodeswork/utils';

describe('koa.params', () => {
  it('should validate require', async () => {
    const m = params({
      foo: validators.required,
    });
    const ctx = getFakeContext({});
    m(ctx, null).should.be.rejectedWith(NodesworkError, {
      meta: {
        errors: [
          { path: 'foo', value: undefined, failed: 'required', reason: '' },
        ],
      },
    });
  });

  it('should validate require with exclamation mark', async () => {
    const m = params({
      '!foo': [],
    });
    const ctx = getFakeContext({});
    m(ctx, null).should.be.rejectedWith(NodesworkError, {
      meta: {
        errors: [
          { path: 'foo', value: undefined, failed: 'required', reason: '' },
        ],
      },
    });
  });

  it('should modified by ltrim', async () => {
    const m = params({
      '!query.foo': validators.ltrim('a'),
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

  it('should allow undefined', async () => {
    const m = params({
      'query.foo': validators.toDate,
    });
    const ctx = getFakeContext({
      query: {},
    });
    await m(ctx, () => null);
    ctx.errors.should.be.empty();
  });

  it('should allow organic', async () => {
    const m = params({
      'query.foo': validators.toDate,
    });
    const ctx = getFakeContext({
      query: { foo: new Date() },
    });
    await m(ctx, () => null);
    ctx.errors.should.be.empty();
  });

  it('should split', async () => {
    const m = params({
      'query.foo': validators.split(),
    });
    const ctx = getFakeContext({
      query: { foo: 'a,b,c' },
    });
    await m(ctx, () => null);
    ctx.errors.should.be.empty();
    ctx.request.query.foo.should.deepEqual(['a', 'b', 'c']);
  });

  it('should work with ~', async () => {
    const m = params({
      '~request.query.foo': validators.split(),
    });
    const ctx = getFakeContext({
      query: { foo: 'a,b,c' },
    });
    await m(ctx, () => null);
    ctx.errors.should.be.empty();
    ctx.request.query.foo.should.deepEqual(['a', 'b', 'c']);
  });

  it('should work with array', async () => {
    const m = params({
      '~request.query.foo': [
        validators.split(),
        validators.array([validators.isEnum(['a', 'b', 'd'])]),
      ],
    });
    const ctx = getFakeContext({
      query: { foo: 'a,b,c' },
    });
    m(ctx, () => null).should.be.rejectedWith(NodesworkError, {
      meta: {
        errors: [
          {
            path: '~request.query.foo.2',
            value: 'c',
            failed: 'array>isEnum',
            reason: '',
          },
        ],
      },
    });
  });
});

function getFakeContext(request: any): Router.IRouterContext & ParamsContext {
  return {
    request,
  } as any;
}
