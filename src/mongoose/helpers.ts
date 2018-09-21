import * as _ from 'underscore';

export function pushMetadata<T>(key: any, target: any, ...metadataValue: T[]): T[] {
  const meta: T[] = Reflect.getOwnMetadata(key, target) || [];
  meta.push(...metadataValue);
  Reflect.defineMetadata(key, meta, target);
  return meta;
}

export function extendMetadata<T>(key: any, target: object, ...metadataValue: T[]): T {
  const meta: T = Reflect.getOwnMetadata(key, target) || {};
  _.extend(meta, ...metadataValue);
  Reflect.defineMetadata(key, meta, target);
  return meta;
}
