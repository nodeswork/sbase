import * as sbase from '../src'
import * as mongoose from 'mongoose'

function source(key: string) {
  return function(target: Object, propertyKey: string | symbol, paramIndex: number) {
    // console.log('target', target);
  };
}

function method(m: string) {
  return function(target: Object, propertyName: string, descriptor: TypedPropertyDescriptor<Function>) {
  };
}

export type UserModelType = typeof UserModel & sbase.mongoose.NModelType
export class UserModel extends sbase.mongoose.NModel {

  static $CONFIG: sbase.mongoose.ModelConfig = {
    dataLevel: {
      levels: []
    }
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

export type EmailUserModelType = typeof EmailUserModel & sbase.mongoose.NModelType
export class EmailUserModel extends UserModel {

  foo1() {}

  static bar1() {
    this.cast<EmailUserModel>();
  }
}
