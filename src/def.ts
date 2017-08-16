import * as mongoose from 'mongoose'

import { NWMongooseModel, INWMongooseModel } from './mongoose-schema'

interface IUser extends INWMongooseModel<User> {
  getAdmins(): Promise<User[]>;
}

class User extends NWMongooseModel {

  $CONFIG = {
    collection:        'users',
    discriminatorKey:  'userType',
  }

  $SCHEMA = {
    username: String,
    password: String,
  }

  username: string
  password: string

  get fullname(): string {
    return this.username;
  }

  set setname(name: string) {
    this.username = name;
  }

  async getDevices(): Promise<string> {
    return null;
  }

  static async getAdmins(): Promise<User[]> {
    var self = this as any as IUser;
    return null;
  }

  static MongooseSchema(): mongoose.Schema {
    return null;
  }
}

let userModel: IUser = User.$register<User, IUser>(mongoose);


// interface IEmailUser extends mongoose.Model<EmailUser>, IUser {
// }

// class EmailUser extends User {
// }

// var t = mongoose.model('User', User.MongooseSchema()) as IEmailUser;

// t.findOne()

// var u: User;
