import * as model from './model';

export type SoftDeleteModelType = typeof SoftDeleteModel;

export class SoftDeleteModel extends model.Model {

  @model.Field({
    type:          Boolean,
    default:       false,
  })
  public deleted:  boolean;

  public async delete(): Promise<this> {
    if (this.deleted) {
      return this;
    }
    this.deleted = true;
    return await this.save();
  }
}

SoftDeleteModel.Pre({
  name:  'remove',
  fn:    blockRemove,
});

for (const name of model.preQueries) {
  SoftDeleteModel.Pre({ name, fn: patchDelete });
}

function patchDelete() {
  if (this._conditions == null) {
    this._conditions = {};
  }

  if (this._conditions.deleted === undefined && !this.options.withDeleted) {
    this._conditions.deleted = false;
  }
}

function blockRemove(next: (err?: any) => void) {
  next(new Error('remove is not supported, use delete instead'));
}
