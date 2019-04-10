import { Document } from 'mongoose';

import * as model from './model';
import * as koa from './koa';
import * as timestamp from './timestamp';
import * as dataLevel from './data-level';

export type A7ModelType = typeof A7Model &
  dataLevel.DataLevelModelType &
  koa.KoaMiddlewaresType &
  timestamp.TimestampModelType;

export interface A7Model extends koa.KoaMiddlewares, timestamp.TimestampModel {}

@model.Mixin(koa.KoaMiddlewares)
@model.Mixin(timestamp.TimestampModel)
@model.Mixin(dataLevel.DataLevelModel)
export class A7Model extends model.DocumentModel {}
