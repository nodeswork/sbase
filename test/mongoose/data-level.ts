import * as _ from 'underscore';
import * as mongoose from 'mongoose';
import * as should from 'should';

import {
  A7Model,
  ArrayField,
  Config,
  DBRefArray,
  Field,
  Level,
  Model,
} from '../../src/mongoose';

enum DataLevels {
  L1 = 'L1',
  L2 = 'L2',
  L3 = 'L3',
  L31 = 'L31',
}

@Config({
  _id: false,
})
class DL13 extends Model {
  @Field() f130: string;
  @Level(DataLevels.L31) f131: string;
}

@Config({
  _id: false,
})
class DL1 extends Model {
  @Level(DataLevels.L1) f11: string;

  @Level(DataLevels.L2) f12: string;

  @ArrayField(DL13)
  @Level(DataLevels.L3)
  f13: DL13[];
}

@Config({
  collection: 'sbase.tests.dlroot',
  dataLevel: {
    levels: DataLevels,
  },
})
class DLRootModel extends A7Model {
  @Field() f1: DL1;
}

@Config({
  collection: 'sbase.tests.dlrootref',
  dataLevel: {
    levels: DataLevels,
  },
})
class DLRootRefModel extends A7Model {
  @DBRefArray('DLRootModel')
  refs: DLRoot[];
}

const DLRoot = DLRootModel.$registerA7Model();
type DLRoot = DLRootModel;

const DLRootRef = DLRootRefModel.$registerA7Model();
type DLRootRef = DLRootRefModel;

describe('NModel Data Level', () => {
  const d1 = {
    f1: {
      f11: 'v11',
      f12: 'v12',
      f13: [
        {
          f130: 'v130',
          f131: 'v131',
        },
      ],
    },
  };

  const e1: any = {
    f1: {
      f11: 'v11',
    },
  };

  const e2: any = {
    f1: {
      f11: 'v11',
      f12: 'v12',
    },
  };

  const e3 = {
    f1: {
      f11: 'v11',
      f12: 'v12',
      f13: [
        {
          f130: 'v130',
        },
      ],
    },
  };

  const e31 = {
    f1: {
      f11: 'v11',
      f12: 'v12',
      f13: [
        {
          f130: 'v130',
          f131: 'v131',
        },
      ],
    },
  };

  let m1: DLRoot;

  beforeEach(async () => {
    await DLRoot.deleteMany({});
    await DLRootRef.deleteMany({});
    m1 = await DLRoot.create(d1);
    await DLRootRef.create({ refs: [m1] });
  });

  it('should be able to retrieve all values', async () => {
    const data = await DLRoot.findOne({});
    _.pick(data.toJSON(), 'f1').should.be.deepEqual(d1);
  });

  it('should be able to retrieve l1 values', async () => {
    const data = await DLRoot.findOne({}, null, {
      level: DataLevels.L1,
    });
    _.pick(data.toJSON(), 'f1').should.be.deepEqual(e1);
  });

  it('should be able to retrieve l2 values', async () => {
    const data = await DLRoot.findOne({}, null, {
      level: DataLevels.L2,
    });
    _.pick(data.toJSON(), 'f1').should.be.deepEqual(e2);
  });

  it('should be able to retrieve l3 values', async () => {
    const data = await DLRoot.findOne({}, null, {
      level: DataLevels.L3,
    });
    _.pick(data.toJSON(), 'f1').should.be.deepEqual(e3);
  });

  it('should be able to retrieve l31 values', async () => {
    const data = await DLRoot.findOne({}, null, {
      level: DataLevels.L31,
    });
    _.pick(data.toJSON(), 'f1').should.be.deepEqual(e31);
  });

  it('should be able to project l1 values', async () => {
    const data = await DLRoot.findOne({});
    _.pick(data.toJSON({ level: DataLevels.L1 }), 'f1').should.be.deepEqual({
      f1: {
        f11: 'v11',
      },
    });
  });

  it('should be able to project l2 values', async () => {
    const data = await DLRoot.findOne({});
    _.pick(data.toJSON({ level: DataLevels.L2 }), 'f1').should.be.deepEqual({
      f1: {
        f11: 'v11',
        f12: 'v12',
      },
    });
  });

  it('should be able to project l3 values', async () => {
    const data = await DLRoot.findOne({});
    _.pick(data.toJSON({ level: DataLevels.L3 }), 'f1').should.be.deepEqual(e3);
  });

  it('should be able to project l31 values', async () => {
    const data = await DLRoot.findOne({});
    _.pick(data.toJSON({ level: DataLevels.L31 }), 'f1').should.be.deepEqual(
      e31,
    );
  });

  it('should be able to populate refs within query', async () => {
    const data = await DLRootRef.findOne({}, null, {
      populate: [{ path: 'refs', options: { level: DataLevels.L1 } }],
    });
    data.refs[0]._id.toString().should.be.equal(m1._id.toString());
    _.pick(data.refs[0].toJSON(), 'f1').should.be.deepEqual(e1);

    let data2 = await DLRootRef.findOne({});

    data2 = await data2
      .populate({ path: 'refs', options: { level: DataLevels.L1 } })
      .execPopulate();
    _.pick(data2.refs[0].toJSON(), 'f1').should.be.deepEqual(e1);
  });
});
