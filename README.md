# @nodeswork/sbase
SBase is a user friendly Typescript wrapper for Mongoose and Koa2.

First, it maps Mongoose schema to a Typescript class and allows to use decorators to config the MongoDB models. It also supports model inherient and model reference.

| Mongoose Features        | SBase implementation                                                            |
| ------------------------ | ------------------------------------------------------------------------------- |
| Collection configuration | Class deocorator @Config                                                        |
| Schema                   | Properties and specific decorators like @Field, @Enum, etc.                     |
| Methods                  | Class methods                                                                   |
| Static methods           | Class static methods                                                            |
| Model registration       | Pre-defined class static methoed Model.$register() & Model.$registerNModel.     |


## Installation

```
$ npm install @nodeswork/sbase
```



## Mongoose Model

### Define User Model

```Typescript

// models/def.ts

export type UserType = typeof User & sbase.mongoose.NModelType

@sbase.mongoose.Config({
  collections: 'users',
})
export class User extends sbase.mongoose.NModel {

  @sbase.mongoose.Field({
    index:     true,
  })
  email:      string;

  @sbase.mongoose.Field()
  firstName:  string;

  @sbase.mongoose.Field()
  lastName:   string

  // get property maps to virtual get function
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  // set property maps to virtual set function
  set fullName(fullName: string) {
    let [firstName, lastName] = fullName.split(' ');
    this.firstName = firstName;
    this.lastName = lastName;
  }

  // method maps to document method
  emailFromDomain(domain: string): boolean {
    return this.email.endsWith(`@${domain}`);
  }

  // static method maps to model method
  static async findByName(firstName: string, lastName: string): Promise<User> {
    let self = this.cast<UserType>();
    return self.findOne({ firstName, lastName });
  }
}

// models/index.ts
import * as defs from './def'

export const User = defs.User.$register<User, UserType>(mongoose);
export type  User = defs.User;

```

### Data Levels

```Typescript

@sbase.mongoose.Config({
  collections: 'users',
  levels: [ 'CREDENTIAL' ],  // specifies the data level
})
export class User extends sbase.mongoose.NModel {

  @sbase.mongoose.Field({
    required:  true,
    level:     'CREDENTIAL',
  })
  password:   string
}

```

`User.find({}, undefined /* projection */, { level: 'MINIMAL' })` returns data with default level

`User.find({}, undefined /* projection */, { level: 'CREDENTIAL' })` returns data with MINIMAL + CREDENTIAL levels

## Koa

### CRUD

### Api Level

### Customized Methods

### Model Bindings

```Typescript
import * as sbase from '@nodeswork/sbase'

export class User extends sbase.mongoose.NModel {

  @sbase.koa.bind('POST')
  async verifyEmail(): Promise<User> {
  }

  @sbase.koa.bind('POST')
  static async forgotPassword(
    @sbase.koa.params('$request.body.email') email: string
  ): Promise<void> {
    let self = this.cast<UserType>();
    let user = await self.findOne({ email });

    if (user == null) {
      throw new NodesworkError('Unknown email address', {
        responseCode: 400,
      });
    }

    await user.sendPasswordReset();
  }
}

```
