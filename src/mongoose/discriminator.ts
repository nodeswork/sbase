import * as _ from 'underscore';
import { Document, Model as MModel } from 'mongoose';

import { A7ModelType } from './a7-model';
import { sbaseMongooseConfig } from './model-config';
import { DocumentModel, Model, lazyFns, shareFns } from './model';

export class Discriminator extends DocumentModel {
  public static $discriminator<
    T extends MModel<Document> & typeof Discriminator,
    M extends typeof Model
  >(
    this: T,
    m: M,
  ): MModel<T & InstanceType<M> & Document> & T & M {
    return discriminatorMultiTenancy(this, m);
  }

  public static $discriminatorA7Model<
    T extends MModel<Document> & typeof Discriminator,
    M extends typeof Model
  >(
    this: T,
    m: M,
  ): MModel<T & InstanceType<M> & Document> &
    T &
    M &
    A7ModelType {
    return this.$discriminator(m) as any;
  }
}

function discriminatorMultiTenancy<
  T extends MModel<Document>,
  M extends typeof Model
>(
  model: T,
  dm: M,
): MModel<T & InstanceType<M> & Document> & T & M {
  if (!sbaseMongooseConfig.multiTenancy.enabled) {
    return model.discriminator<InstanceType<T> & InstanceType<M> & Document>(
      dm.name,
      dm.$mongooseOptions().mongooseSchema,
    ) as any;
  }

  const tenants = ['default'].concat(sbaseMongooseConfig.multiTenancy.tenants);
  const tenantMap: {
    [key: string]: MModel<Document> & T;
  } = {};

  const currentTenantMap = this.$tenantMap;

  for (const tenancy of tenants) {
    tenantMap[tenancy] = currentTenantMap[tenancy].discriminator(
      dm.name,
      dm.$mongooseOptions(tenancy).mongooseSchema,
    );
  }

  const proxy: any = new Proxy<MModel<Document> & T>({} as any, {
    get: (_obj: {}, prop: string) => {
      if (lazyFns.indexOf(prop) >= 0) {
        const ret = function() {
          const t = sbaseMongooseConfig.multiTenancy.tenancyFn(prop);
          const m1: any = tenantMap[t];
          const actualFn = m1[prop];

          return actualFn.apply(this, arguments);
        };
        return ret;
      }

      if (shareFns.indexOf(prop) >= 0) {
        const ret = () => {
          return _.map(tenants, t => {
            const m2: any = tenantMap[t];
            return m2[prop].apply(m2, arguments);
          });
        };
        return ret;
      }

      const tenancy = sbaseMongooseConfig.multiTenancy.tenancyFn(prop);
      const m: any = tenantMap[tenancy];
      m._proxy = proxy;

      if (prop === '$modelClass') {
        return m;
      }

      const res = m[prop];
      return _.isFunction(res) ? res.bind(m) : res;
    },
    set: (_obj: {}, prop: string, value: any) => {
      const tenancy = sbaseMongooseConfig.multiTenancy.tenancyFn(prop);
      const m: any = tenantMap[tenancy];
      m[prop] = value;
      return true;
    },
  });

  return proxy;
}
