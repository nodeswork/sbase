
import * as sbase from '../src'
import * as mongoose from 'mongoose'

type UserModelType = typeof UserModel & sbase.mongoose.NModelType
class UserModel extends sbase.mongoose.NModel {

  foo() { }

  static bar() {}
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

  User.createMiddleware()
}
