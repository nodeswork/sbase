import * as mongoose from 'mongoose';

import { A7Model, Config, Field } from '../../../../src/mongoose';
import { Address, addressSchema } from './addresses';

/**
 * Define property model using sbase.
 */
@Config({
  collection: 'sbase.benchmark.properties',
})
export class NProperty extends A7Model {
  @Field() address: Address;
}

export const Property = NProperty.$registerA7Model<
  NProperty,
  typeof NProperty
>();
export type Property = NProperty;

/**
 * Define property model using mongoose.
 */
export const propertySchema = new mongoose.Schema({
  address: {
    type: addressSchema,
    default: () => ({}),
  },
});

export const MongooseProperty = mongoose.model('MProperty', propertySchema);
