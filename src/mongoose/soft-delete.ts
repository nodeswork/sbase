import * as model from './model';

export type SoftDeleteModelType = typeof SoftDeleteModel;

@model.Pre({
  name:  'remove',
  fn:    blockRemove,
})
@model.Pres(model.preQueries, { fn: patchDelete })
export class SoftDeleteModel extends model.DocumentModel {

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
