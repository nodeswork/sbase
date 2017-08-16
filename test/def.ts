
import * as sbase from '../src'
import * as mongoose from 'mongoose'

class UserModel extends sbase.mongoose.NModel {

  foo() { }

  static bar() {}
}

class EmailUserModel extends UserModel {

  foo1() {}

  static bar1() {
    this.cast<EmailUserModel>();
  }
}

var User = UserModel.$register<UserModel, typeof UserModel>(mongoose);

// var Email = EmailUserModel.$register<EmailUserModel, typeof EmailUserModel>(mongoose);

async function E() {
  var user = await User.findOne();
  user.foo();
  User.bar();

  user = await user.save();

  // var eUser = await Email.findOne();
  // eUser.foo();
  // eUser.foo1();
  // Email.bar();
  // Email.bar1();
}
