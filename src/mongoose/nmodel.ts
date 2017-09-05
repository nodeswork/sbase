import * as model from './model'
import * as koa from './koa'
import * as timestamp from './timestamp'
import * as softDelete from './soft-delete'
import * as dataLevel from './data-level'

export type NModelType = (
  typeof NModel &
  dataLevel.DataLevelModelType &
  koa.KoaMiddlewaresType &
  timestamp.TimestampModelType &
  softDelete.SoftDeleteModelType
);

export interface NModel extends koa.KoaMiddlewares,
  timestamp.TimestampModel, softDelete.SoftDeleteModel {
}

export class NModel extends model.Model {
}

NModel.Mixin(koa.KoaMiddlewares)
NModel.Mixin(timestamp.TimestampModel)
NModel.Mixin(softDelete.SoftDeleteModel)
NModel.Mixin(dataLevel.DataLevelModel)

export const AUTOGEN   = koa.AUTOGEN;
export const READONLY  = koa.READONLY;
