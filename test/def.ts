
import * as sbase from '../src'
import * as mongoose from 'mongoose'

function source(key: string) {
  return function(target: Object, propertyKey: string | symbol, paramIndex: number) {
    console.log('target', target);
  };
}

function method(m: string) {
  return function(target: Object, propertyName: string, descriptor: TypedPropertyDescriptor<Function>) {
  };
}

type UserModelType = typeof UserModel & sbase.mongoose.NModelType
class UserModel extends sbase.mongoose.NModel {

  static $CONFIG: sbase.mongoose.ModelConfig = {
    levels: []
  }

  foo() { }

  static bar() {}

  async verifyEmail(
    @source('request.query.dryrun:Boolean') dryRun: boolean
  ): Promise<void> {
  }

  @method('POST')
  static async forgotPassword(
    @source('requst.body.email:Email') email: string,
  ): Promise<void> {
  }
}

type EmailUserModelType = typeof EmailUserModel & sbase.mongoose.NModelType
class EmailUserModel extends UserModel {

  foo1() {}

  static bar1() {
    this.cast<EmailUserModel>();
  }
}

var User = UserModel.$register<UserModel, UserModelType>(mongoose);

var Email = EmailUserModel.$register<EmailUserModel, EmailUserModelType>(
  mongoose
);

async function E() {
  var user = await User.findOne();
  user.foo();
  User.bar();

  user.createdAt;
  user.lastUpdateTime;
  user.deleted;

  user = await user.save();

  var eUser = await Email.findOne();
  eUser.foo();
  eUser.foo1();
  Email.bar();
  Email.bar1();

  User.createMiddleware({})
}


let router = new sbase.koa.NRouter()

router

  .nModel(User, {

    field: 'userId',

    use:   [],

    cruds: {
      create: true,
      get:    {
      },
      // find:   true,
      // update: true,
      // delete: true,
    },

    methods: {
      verifyEmail: true,
    },

    statics: {

      forgotPassword: {
      }
    },
  })
