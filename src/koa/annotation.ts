import "reflect-metadata";

import { IRouterContext } from 'koa-router'

import { filters, IParamFilter } from './params'

const sourceMetadataKey = Symbol('source');

export function params(...args: any[]) {
  let resolver: IParamFilter = filters.parse.apply(null, arguments);

  return function(
    target: Object, propertyKey: string | symbol, paramIndex: number
  ) {

    let methodResolver: IParamFilter[] = Reflect.getOwnMetadata(
      sourceMetadataKey, target, propertyKey
    ) || [];

    methodResolver[paramIndex] = resolver;
    Reflect.defineMetadata(
      sourceMetadataKey, methodResolver, target, propertyKey
    );
  };
}

export function bind(met: string, options: IMethodOptions = {}) {

  return function(
    target: Object, propertyName: string,
    descriptor: TypedPropertyDescriptor<Function>
  ) {
    let methodResolver: IParamFilter[] = Reflect.getOwnMetadata(
      sourceMetadataKey, target, propertyName
    ) || [];
    let origMethod = descriptor.value;

    let newMethod = async function(
      ctx: IRouterContext, next: Function
    ): Promise<void> {
      let args = [];
      for (let idx = 0; idx < methodResolver.length; idx++) {
        args[idx] = methodResolver[idx](ctx, ctx);
      }
      let obj = await origMethod.apply(this, args);
      ctx.body = obj;

      if (options.triggerNext) {
        await next();
      }

      return obj;
    };

    (newMethod as any).method = met;

    descriptor.value = newMethod;
  };
}

export type IMethodOptions  = {
  triggerNext?: boolean
}
