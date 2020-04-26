import { A7Model } from '../../mongoose';
import { Model } from './model';

type AsObjectSingle<T extends Model> = Omit<
  T,
  Exclude<keyof A7Model, '_id' | 'createdAt' | 'lastUpdateTime'>
>;

export type AsObject<T extends Model> = {
  [key in keyof AsObjectSingle<T>]: T[key];
};
