import * as should from 'should';

import * as sbase from '../../src';

enum UserDataLevel {
  BASIC    = 'BASIC',
  DETAILS  = 'DETAILS',
}

class Name extends sbase.mongoose.Model {

  @sbase.mongoose.Field({
    default:  'A_FIRSTNAME',
  })
  first:      string;

  @sbase.mongoose.Field({
    default:  'A_LASTNAME',
  })
  last:       string;
}

export enum UserType {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

@sbase.mongoose.Config({
  collection:        'sbase.tests.users',
  discriminatorKey:  'kind',
  dataLevel:         {
    levels:          UserDataLevel,
  },
})
class UserModel extends sbase.mongoose.NModel {

  @sbase.mongoose.Field({
    level:    UserDataLevel.BASIC,
  })
  name: Name;

  @sbase.mongoose.Field({
    level:  UserDataLevel.DETAILS,
  })
  bio: string;

  @sbase.mongoose.Field({
    type: [Name],
  })
  children: Name[];

  @sbase.mongoose.EnumField(UserType)
  type: UserType;

  get fullname() {
    return this.name.first + ' ' + this.name.last;
  }
}

const User = UserModel.$register<UserModel, typeof UserModel>();
type  User = UserModel;

describe('NModel Basics', () => {

  beforeEach(async () => {
    await User.remove({});
  });

  it('should generate default value', async () => {
    const user = await User.create({});
    user.name.first.should.be.equal('A_FIRSTNAME');
    user.name.last.should.be.equal('A_LASTNAME');
  });

  it('should return only one level data', async () => {
    const user = await User.create({
      name: {
        first: 'foo',
        last: 'bar',
      },
      bio: 'tie',
    });
    user.name.first.should.be.equal('foo');
    user.name.last.should.be.equal('bar');
    user.bio.should.be.equal('tie');

    const user1 = await User.findById(user._id, {}, { level: UserDataLevel.BASIC });
    user1.name.first.should.be.equal('foo');
    user1.name.last.should.be.equal('bar');
    should(user1.bio).not.be.ok();
  });

  it('should set getter correct', async () => {
    const user = await User.create({
      name: {
        first: 'foo',
        last: 'bar',
      },
      bio: 'tie',
    });
    user.fullname.should.be.equal('foo bar');
  });
});
