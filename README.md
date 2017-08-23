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
    username:    String
  }

  username:      string
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
