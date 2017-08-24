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
    email:    String
    index:    true
  }

  email:      string
}

// models/index.ts
import * as defs from './def'

export let User = defs.User.$register<User, UserType>(mongoose);

```

### Data Levels

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
