# @nodeswork/sbase
Basic REST api foundation from Nodeswork.


## Installation

```
$ npm install @nodeswork/sbase
```



## Mongoose Model

### Define User Model

```Typescript

// models/def.ts

export type UserType = typeof User & sbase.mongoose.NModelType

export class User extends sbase.mongoose.NModel {

  // Configuration when creating mongoose schema
  static $CONFIG = {
    collections: 'users'
  }

  // Mongoose schema
  static $SCHEMA = {
    email:       {
      type:      String,
      index:     true,
    },
    firstName:   string,
    lastName:    string,
  }

  email:      string
  firstName:  string
  lastName:   string

  // get maps to virtual get function
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  // set maps to virtual set function
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

export let User = defs.User.$register<User, UserType>(mongoose);

```

### Data Levels

```Typescript

export class User extends sbase.mongoose.NModel {

  // Configuration when creating mongoose schema
  static $CONFIG = {
    // specifies the data level
    levels: [ 'CREDENTIAL' ]
  }

  // Mongoose schema
  static $SCHEMA = {
    password:    {
      type:      String,
      required:  true,
      level:     'CREDENTIAL',
    },
  }

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
