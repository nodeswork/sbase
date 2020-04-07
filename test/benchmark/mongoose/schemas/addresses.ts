import * as _ from 'underscore';
import * as mongoose from 'mongoose';

import { Model, Optional, Required } from '../../../../src/mongoose';

/**
 * Define address model using sbase.
 */
export class Address extends Model {
  @Required() address: string;
  @Optional() address2?: string;
  @Required() city: string;
  @Required() state: string;
  @Required() country: string;
  @Required() zipCode: string;

  get fullAddress(): string {
    const parts = _.filter(
      [
        this.address,
        this.address2,
        this.city,
        _.filter([this.state, this.zipCode], x => !!x).join(' '),
      ],
      x => !!x,
    );
    return _.isEmpty(parts) ? '<unset address>' : parts.join(', ');
  }
}

/**
 * Define address model using mongoose.
 */
export const addressSchema = new mongoose.Schema({
  address: {
    type: String,
    required: true,
  },
  address2: {
    type: String,
  },
  city: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  country: {
    type: String,
    required: true,
  },
  zipCode: {
    type: String,
    required: true,
  },
});
