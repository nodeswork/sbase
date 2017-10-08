import * as model      from './model';
import * as koa        from './koa';
import * as timestamp  from './timestamp';
import * as dataLevel  from './data-level';

export type NModelType = (
  typeof NModel &
  dataLevel.DataLevelModelType &
  koa.KoaMiddlewaresType &
  timestamp.TimestampModelType
);

export interface NModel extends koa.KoaMiddlewares,
  timestamp.TimestampModel {
}

export class NModel extends model.Model {
}

NModel.Mixin(koa.KoaMiddlewares);
NModel.Mixin(timestamp.TimestampModel);
NModel.Mixin(dataLevel.DataLevelModel);
