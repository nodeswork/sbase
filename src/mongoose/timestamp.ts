import * as model from './model'

export type TimestampModelType = typeof TimestampModel

export class TimestampModel extends model.Model {

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
  }

  createdAt:       Date
  lastUpdateTime:  Date
}

TimestampModel.Pre({
  name:  'save',
  fn:    setLastUpdateTimeOnSave,
});

TimestampModel.Pre({
  name:  'findOneAndUpdate',
  fn:    setLastUpdateTimeOnUpdate,
});

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
