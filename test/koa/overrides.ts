import { overrides } from '../../src/koa';

describe('koa.overrides', () => {
  it('overrides simple value', async () => {
    const ctx: any = {
      foo: 'bar',
    };

    await overrides('foo->foo')(ctx, () => Promise.resolve());

    ctx.should.be.deepEqual({ foo: 'bar', overrides: { foo: 'bar' } });
  });

  it('overrides nested value', async () => {
    const ctx: any = {
      foo: 'bar',
    };

    await overrides('foo->foo.foo2')(ctx, () => Promise.resolve());

    ctx.should.be.deepEqual({
      foo: 'bar',
      overrides: { foo: { foo2: 'bar' } },
    });
  });

  it('overrides from const value', async () => {
    const ctx: any = {};

    await overrides(['const', 'foo.foo2'])(ctx, () => Promise.resolve());

    ctx.should.be.deepEqual({
      overrides: { foo: { foo2: 'const' } },
    });
  });

  it('overrides array value', async () => {
    const ctx: any = {};

    await overrides(['const', 'foo.[].foo2'], ['const2', 'foo.[].foo2'])(
      ctx,
      () => Promise.resolve(),
    );

    ctx.should.be.deepEqual({
      overrides: { foo: [{ foo2: 'const' }, { foo2: 'const2' }] },
    });
  });

  it('overrides regex value', async () => {
    const ctx: any = {};

    await overrides(
      ['^foo.*$', 'foo.[].foo2', 'regex'],
      ['const2', 'foo.[].foo2'],
    )(ctx, () => Promise.resolve());

    ctx.should.be.deepEqual({
      overrides: { foo: [{ foo2: /^foo.*$/ }, { foo2: 'const2' }] },
    });
  });

  it('overrides regex value with arguments', async () => {
    const ctx: any = {};

    await overrides(
      ['^foo.*$', 'foo.[].foo2', 'regex', 'i'],
      ['const2', 'foo.[].foo2'],
    )(ctx, () => Promise.resolve());

    ctx.should.be.deepEqual({
      overrides: { foo: [{ foo2: /^foo.*$/i }, { foo2: 'const2' }] },
    });
  });

  it('overrides date string value', async () => {
    const ctx: any = {
      foo: new Date('2020-01-01'),
    };

    await overrides('foo->foo:string')(ctx, () => Promise.resolve());

    ctx.should.be.deepEqual({
      foo: ctx.foo,
      overrides: { foo: new Date('2020-01-01').toString() },
    });
  });
});
