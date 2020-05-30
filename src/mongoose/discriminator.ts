import * as _ from 'underscore';
import { Document, Model as MModel } from 'mongoose';

import { A7ModelType } from './a7-model';
import { ConvertModel } from './types';
import { DocumentModel, Model, lazyFns, shareFns } from './model';
import { SBaseMongooseConfig } from './model-config';

export class Discriminator extends DocumentModel {
  public static $discriminator<
    T extends ConvertModel<Document, any> & typeof Discriminator,
    M extends typeof Model
  >(
    this: T,
    m: M,
  ): ConvertModel<T & InstanceType<M> & Document, T & InstanceType<M>> & T & M {
    return discriminatorMultiTenancy(this, m);
  }

  public static $discriminatorA7Model<
    T extends ConvertModel<Document, any> & typeof Discriminator,
    M extends typeof Model
  >(
    this: T,
    m: M,
  ): ConvertModel<T & InstanceType<M> & Document, T & InstanceType<M>> &
    T &
    M &
    A7ModelType {
    return this.$discriminator(m) as any;
  }
}

function discriminatorMultiTenancy<
  T extends ConvertModel<Document, any>,
  M extends typeof Model
>(
  model: T,
  dm: M,
): ConvertModel<T & InstanceType<M> & Document, T & InstanceType<M>> & T & M {
  const sbaseConfig: SBaseMongooseConfig = (model as any).sbaseConfig;

  if (!sbaseConfig.multiTenancy.enabled) {
    const m = model.discriminator(
      dm.name,
      dm.$mongooseOptions().mongooseSchema,
    ) as any;

    m.sbaseConfig = sbaseConfig;

    return m;
  }

  const tenants = ['default'].concat(sbaseConfig.multiTenancy.tenants);
  const tenantMap: {
    [key: string]: MModel<Document> & T;
  } = {};

  const currentTenantMap = (model as any)._proxy.$tenantMap;

  for (const tenancy of tenants) {
    const m = currentTenantMap[tenancy].discriminator(
      dm.name,
      dm.$mongooseOptions(sbaseConfig, tenancy).mongooseSchema,
    );

    m.sbaseConfig = sbaseConfig;

    tenantMap[tenancy] = m;
  }

  const proxy: any = new Proxy<MModel<Document> & T>({} as any, {
    get: (_obj: {}, prop: string) => {
      if (lazyFns.indexOf(prop) >= 0) {
        const ret = function () {
          const t = sbaseConfig.multiTenancy.tenancyFn(prop);
          const m1: any = tenantMap[t];
          const actualFn = m1[prop];

          return actualFn.apply(this, arguments);
        };
        return ret;
      }

      if (shareFns.indexOf(prop) >= 0) {
        const ret = () => {
          return _.map(tenants, (t) => {
            const m2: any = tenantMap[t];
            return m2[prop].apply(m2, arguments);
          });
        };
        return ret;
      }

      const tenancy = sbaseConfig.multiTenancy.tenancyFn(prop);
      const m: any = tenantMap[tenancy];
      m._proxy = proxy;

      if (prop === '$modelClass') {
        return m;
      }

      const res = m[prop];
      return _.isFunction(res) ? res.bind(m) : res;
    },
    set: (_obj: {}, prop: string, value: any) => {
      const tenancy = sbaseConfig.multiTenancy.tenancyFn(prop);
      const m: any = tenantMap[tenancy];
      m[prop] = value;
      return true;
    },
  });

  return proxy;
}
