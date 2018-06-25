import { Document }    from 'mongoose';

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

@model.Mixin(koa.KoaMiddlewares)
@model.Mixin(timestamp.TimestampModel)
@model.Mixin(dataLevel.DataLevelModel)
export class NModel extends model.DocumentModel {
}
