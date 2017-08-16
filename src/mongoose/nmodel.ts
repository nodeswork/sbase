import * as model from './model'

export type NModelType = typeof NModel

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
}

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

  this._conditions.deleted = false;
}
