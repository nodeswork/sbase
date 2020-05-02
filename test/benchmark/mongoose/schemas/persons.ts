import * as mongoose from 'mongoose';

import { A7Model, Config, Field, DBRef } from '../../../../src/mongoose';
import { Property } from './properties';

/**
 * Define person model using sbase.
 */
@Config({
  collection: 'sbase.benchmark.persons',
})
export class NPerson extends A7Model {
  @Field() firstName: string;

  @Field() lastName: string;

  @DBRef('NProperty') home: Property;

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

export const Person = NPerson.$registerA7Model();
export type Person = NPerson;

/**
 * Define person model using mongoose.
 */
export const personSchema = new mongoose.Schema({
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  home: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'MProperty',
  },
});

personSchema.virtual('fullName').get(function fullName() {
  return `${this.firstName} ${this.lastName}`;
});

export const MongoosePerson = mongoose.model('MPerson', personSchema);
