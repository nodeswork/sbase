import * as model from './model';

export type TimestampModelType = typeof TimestampModel;

@model.Pre({
  name: 'save',
  fn: setLastUpdateTimeOnSave,
})
@model.Pre({
  name: 'findOneAndUpdate',
  fn: setLastUpdateTimeOnUpdate,
})
export class TimestampModel extends model.Model {
  @model.Field({
    default: Date.now,
    index: true,
  })
  createdAt?: Date;

  @model.Field({
    index: true,
  })
  lastUpdateTime?: Date;
}

function setLastUpdateTimeOnSave(next: () => void) {
  this.lastUpdateTime = Date.now();
  next();
}

function setLastUpdateTimeOnUpdate(next: () => void) {
  this.update(
    {},
    {
      $set: {
        lastUpdateTime: Date.now(),
      },
      $setOnInsert: {
        createdAt: Date.now(),
      },
    },
  );
  next();
}
