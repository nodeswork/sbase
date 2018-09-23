# @nodeswork/sbase

SBase is a user-friendly Typescript wrapper on top of Mongoose and KOA2. It maps
the model to a Typescript class, the schemas to the class properties, and the
methods to the class methods so that all the model configurations are
centralized and the models have distinct property types. It also supports model
inheritance and mixin so that common logic can be abstracted out. It has some
useful pre-defined model extensions, such as auto-generate timestamp, KOA2
middlewares, etc.

Below listed how SBase mapping the Mongoose definitions.

| Mongoose Features        | SBase Implementation                                                            |
| ------------------------ | ------------------------------------------------------------------------------- |
| Collection configuration | Class deocorator @Config                                                        |
| Schema                   | Properties and specific decorators like @Field, @Enum, etc.                     |
| Methods                  | Class methods                                                                   |
| Static methods           | Class static methods                                                            |
| Model registration       | Pre-defined class static methoed Model.$register() & Model.$registerNModel().   |


## Installation

```
$ npm install @nodeswork/sbase
```

## Mongoose Model

### Define User Model

```Typescript

// models/def.ts

import { Config, Field, NModel } from '@nodeswork/sbase/mongoose';

@Config({
  collections: 'users',
})
export class User extends NModel {

  @Unique() email: string;

  @Field() firstName: string;

  @Field() lastName: string

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

export const User = defs.User.$registerNModel<User, typeof User>();
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
