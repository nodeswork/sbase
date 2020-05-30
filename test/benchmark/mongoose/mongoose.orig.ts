import { MongoosePerson, Person } from './schemas/persons';
import { MongooseProperty, Property } from './schemas/properties';

describe('benchmark.mongoose', () => {
  beforeEach(async () => {
    await Person.deleteMany({});
    await MongoosePerson.deleteMany({});

    for (let i = 0; i < INSERT_BATCH; i++) {
      const h1 = await MongooseProperty.create({
        address: {
          address: `address {i}`,
          address2: `address2 {i}`,
          city: `city {i}`,
          state: `state {i}`,
          country: `country {i}`,
          zipCode: `zipCode {i}`,
        },
      });

      await MongoosePerson.create({
        firstName: `foo name ${i}`,
        lastName: `bar name ${i}`,
        home: h1,
      });

      const h2 = await Property.create({
        address: {
          address: `address {i}`,
          address2: `address2 {i}`,
          city: `city {i}`,
          state: `state {i}`,
          country: `country {i}`,
          zipCode: `zipCode {i}`,
        },
      });

      await Person.create({
        firstName: `foo name ${i}`,
        lastName: `bar name ${i}`,
        home: h2,
      });
    }
  });

  const INSERT_BATCH = 1000;

  it(`[mongoose]\truns ${INSERT_BATCH} synchronize persons insert`, async () => {
    for (let i = 0; i < INSERT_BATCH; i++) {
      await MongoosePerson.create({
        firstName: `foo name ${i}`,
        lastName: `bar name ${i}`,
      });
    }
  });

  it(`[sbase]\t\truns ${INSERT_BATCH} synchronize persons insert`, async () => {
    for (let i = 0; i < INSERT_BATCH; i++) {
      await Person.create({
        firstName: `foo name ${i}`,
        lastName: `bar name ${i}`,
      });
    }
  });

  it(`[mongoose]\truns ${INSERT_BATCH} synchronize persons find`, async () => {
    for (let i = 0; i < INSERT_BATCH; i++) {
      await MongoosePerson.find(
        {
          firstName: `foo name ${i}`,
        },
        null,
        { populate: [{ path: 'home' }] as any },
      );
    }
  });

  it(`[sbase]\t\truns ${INSERT_BATCH} synchronize persons find`, async () => {
    for (let i = 0; i < INSERT_BATCH; i++) {
      await Person.find(
        {
          firstName: `foo name ${i}`,
        },
        null,
        { populate: [{ path: 'home' }] as any },
      );
    }
  });

  it(`[mongoose]\truns ${INSERT_BATCH} synchronize persons find using lean`, async () => {
    for (let i = 0; i < INSERT_BATCH; i++) {
      await MongoosePerson.find(
        {
          firstName: `foo name ${i}`,
        },
        null,
      ).lean();
    }
  });

  it(`[sbase]\t\truns ${INSERT_BATCH} synchronize persons find using lean`, async () => {
    for (let i = 0; i < INSERT_BATCH; i++) {
      await Person.find(
        {
          firstName: `foo name ${i}`,
        },
        null,
      ).lean();
    }
  });

  it(`[mongoose]\truns ${INSERT_BATCH} synchronize persons find limit 10 using lean`, async () => {
    for (let i = 0; i < INSERT_BATCH; i++) {
      await MongoosePerson.find(
        {
          firstName: `foo name ${i}`,
        },
        null,
        { lean: true },
      )
        .skip(i)
        .limit(10);
    }
  });

  it(`[sbase]\t\truns ${INSERT_BATCH} synchronize persons find limit 10 using lean`, async () => {
    for (let i = 0; i < INSERT_BATCH; i++) {
      await Person.find({}, null).skip(i).limit(10);
    }
  });
});
