import * as model from './model'
import * as koa from './koa'

type NModelType = typeof NModel & koa.KoaMiddlewaresType;

export interface NModel extends koa.KoaMiddlewares {}

export class NModel extends model.Model {

  static $SCHEMA = {

    createdAt: {
      type:          Date,
      default:       Date.now,
      index:         true,
    },

    lastUpdateTime: {
      type:          Date,
      index:         true,
    },

    deleted:         {
      type:          Boolean,
      default:       false,
    },
  }

  createdAt:       Date
  lastUpdateTime:  Date
  deleted:         boolean

  async delete(): Promise<this> {
    if (this.deleted) {
      return this;
    }
    this.deleted = true;
    return await this.save();
  }
}

NModel.Pre({
  name:  'remove',
  fn:    blockRemove,
})

NModel.Pre({
  name:  'save',
  fn:    setLastUpdateTimeOnSave,
});

NModel.Pre({
  name:  'findOneAndUpdate',
  fn:    setLastUpdateTimeOnUpdate,
});

for (let name of model.preQueries) {
  NModel.Pre({ name, fn: patchDelete });
}

function setLastUpdateTimeOnSave(next: Function) {
  this.lastUpdateTime = Date.now();
  next();
}

function setLastUpdateTimeOnUpdate(next: Function) {
  this.update({}, {
    '$set': {
      lastUpdateTime: Date.now(),
    },
    '$setOnInsert': {
      createdAt: Date.now(),
    }
  });
  next();
}

function patchDelete() {
  if (this._conditions == null) {
    this._conditions = {};
  }

  if (this._conditions.deleted === undefined && !this.options.withDeleted) {
    this._conditions.deleted = false;
  }
}

function blockRemove(next: Function) {
  next(new Error('remove is not supported, use delete instead'));
}
