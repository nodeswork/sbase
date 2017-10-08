import * as sbase from '../../src'
import * as mongoose from 'mongoose';

import {
  UserModel,
  UserModelType,
  EmailUserModel,
  EmailUserModelType,
} from '../def';

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
