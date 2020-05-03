import * as mongodb from 'mongodb';
import { Document, Model as MModel } from 'mongoose';

import { A7Model } from './a7-model';
import { Model } from './model';

type AsObjectSingle<T extends Model> = Omit<
  T,
  Exclude<keyof A7Model, '_id' | 'createdAt' | 'lastUpdateTime'>
>;

export type AsObject<T extends Model> = {
  [key in keyof AsObjectSingle<T>]: T[key];
};

export type DeepPartial<T> = T extends Function
  ? T
  : T extends object
  ? { [P in keyof T]?: DeepPartial<T[P]> }
  : T;

export type AsObjectPartial<T extends Model> = DeepPartial<AsObject<T>>;

export type PartialDoc<X> = AsObjectPartial<X>;

export interface ModifiedMongooseModel<T extends Document, M>
  extends Omit<MModel<T>, 'create' | 'insertMany'> {
  create(doc: PartialDoc<M>, options?: mongoose.SaveOptions): Promise<T>;

  insertMany(
    docs: PartialDoc<M>,
    options?: mongoose.InsertManyOptions,
  ): Promise<T>;

  insertMany(
    docs: PartialDoc<M>[],
    options?: mongoose.InsertManyOptions,
  ): Promise<T[]>;

  findOneAndReplace(
    query: any,
    update: PartialDoc<M>,
    options?: mongoose.FindOneAndReplaceOptions,
  ): Promise<T>;
}

export type ConvertModel<T extends Document, X> = ModifiedMongooseModel<T, X>;

namespace mongoose {
  export interface SaveOptions {
    safe?: boolean | WriteConcern;
    validateBeforeSave?: boolean;
    session?: ClientSession;
  }

  export interface InsertManyOptions {
    ordered?: boolean;
    rawResult?: boolean;
  }

  export interface WriteConcern {
    j?: boolean;
    w?: number | 'majority' | TagSet;
    wtimeout?: number;
  }

  export interface TagSet {
    [k: string]: string;
  }

  export interface ClientSession extends mongodb.ClientSession {}

  export interface FindOneAndReplaceOptions {
    /** if true, return the modified document rather than the original. defaults to false (changed in 4.0) */
    new?: boolean;
    /** creates the object if it doesn't exist. defaults to false. */
    upsert?: boolean;
    /** if true, runs update validators on this command. Update validators validate the update operation against the model's schema. */
    runValidators?: boolean;
    /**
     * if this and upsert are true, mongoose will apply the defaults specified in the model's schema if a new document
     * is created. This option only works on MongoDB >= 2.4 because it relies on MongoDB's $setOnInsert operator.
     */
    setDefaultsOnInsert?: boolean;
    /**
     * if set to 'query' and runValidators is on, this will refer to the query in custom validator
     * functions that update validation runs. Does nothing if runValidators is false.
     */
    context?: string;
    /**
     *  by default, mongoose only returns the first error that occurred in casting the query.
     *  Turn on this option to aggregate all the cast errors.
     */
    multipleCastError?: boolean;
    /** Field selection. Equivalent to .select(fields).findOneAndUpdate() */
    fields?: any | string;
    /** If true, delete any properties whose value is undefined when casting an update. In other words,
    if this is set, Mongoose will delete baz from the update in Model.updateOne({}, { foo: 'bar', baz: undefined })
    before sending the update to the server.**/
    omitUndefined?: boolean;
    session?: ClientSession;
    /**
     * Only update elements that match the arrayFilters conditions in the document or documents that match the query conditions.
     */
    arrayFilters?: { [key: string]: any }[];
  }
}
