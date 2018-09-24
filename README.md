# @nodeswork/sbase

SBase is a user-friendly Typescript wrapper on top of
[Mongoose](https://mongoosejs.com/) and [Koa2](https://koajs.com/).

## Key Features

### 1. Model Definition

It maps the db model to a Typescript class, the db schema to the class
properties, and the methods to the class methods so that all the model
configuration code is well organized in a centralized place and the models have
distinct property types. It also supports model inheritance and mixin so that
common logic can be abstracted out. It has some useful pre-defined model
extensions, such as auto-generate timestamp, KOA2 middlewares, etc.

Below listed how SBase mapping the Mongoose definitions.

| Mongoose Features        | SBase Implementation                                                            |
| ------------------------ | ------------------------------------------------------------------------------- |
| Collection configuration | Class deocorator @Config                                                        |
| Schema                   | Properties combines with decorators like @Field, @Enum, @Unique, etc.           |
| Methods                  | Class methods                                                                   |
| Static methods           | Class static methods                                                            |
| Model registration       | Pre-defined class static methoed Model.$register() & Model.$registerNModel().   |

### 2. Web Context Validation

It provides numerious built-in
[validators](https://www.npmjs.com/package/validator) and sanitizers that can
validate any fields under `ctx`, usually query param and body.

```Typescript
import { params, isByteLength, isEmail, ltrim, rtrim } from '@nodeswork/sbase/koa';

router
  .post('/user', params({
    body: {
      '!email': isEmail,
      '!description': [ isByteLength(6, 1400), ltrim(), rtrim() ],
    },
  }))
  // ... other middleware chain
;
```

### 3. Model-direct Koa Middlewares

## Installation

```
$ npm install @nodeswork/sbase
```

## Quick Start

### Define a Model

Models are defined by extending `NModel` or `Model` class.

```Typescript

// models/users.ts

import { Config, Field, NModel } from '@nodeswork/sbase/mongoose';

// Pass-in model configuration
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
  isEmailFromDomain(domain: string): boolean {
    return this.email.endsWith(`@${domain}`);
  }

  // static method maps to model method
  static async findByName(firstName: string, lastName: string): Promise<User> {
    let self = this.cast<UserType>();
    return self.findOne({ firstName, lastName });
  }
}
```

### Register the Model

Register models and expose model types.

```Typescript

// models/index.ts

import * as users from './users';

export const User = users.User.$registerNModel<User, typeof User>();
export type  User = users.User;

```

### Use the Model

Use the model with normal Mongoose interfaces.

```Typescript
import { User } from './models';

(async function usage() {

  // Create a new user.
  const user = await User.create({
    email: 'test@abc.com',
    firstName: 'Alice',
    lastName: 'North',
  });

  // Getter
  user.fullName === 'Alice North';  // returns true

  // Modify the user's first name.
  user.firstName = 'Bob';
  // or
  user.fullName = 'Bob North';

  // Save the modified model.
  await user.save();

  // Find by user attributes.
  const user = await User.findOne({
    email: 'test@abc.com',
  });

  // Instance method
  user.isEmailFromDomain('abc.com');  // returns true

  // Class method
  await User.findByName('Bob', 'North');  // returns the instance

})();

```

## Advanced Features

### Field Definition

**Field**

The common decorator is `@Field`, which accepts the schema and passes down to
the Mongoose schema object.

For example, to define a field phone number and specifies the regex validation:

```Typescript
import { Config, Field, NModel } from '@nodeswork/sbase/mongoose';

@Config({})
export class User extends NModel {

  @Field({
    type: String,
    validate: {
      validator: function(v) {
        return /\d{3}-\d{3}-\d{4}/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`,
    },
    required: [true, 'User phone number required'],
  }) phone: string;
}

```

There are many other decorators to make definitions easiler.

**ArrayField**

`@ArrayField` allows to define an array of any other type.

```Typescript
import { ArrayField, NModel } from '@nodeswork/sbase/mongoose';

export class User extends NModel {
  @ArrayField(String) phones: string[];
}
```

**DBRef**

`@DBRef` allows to reference to other models.

```Typescript
import { DBRef, NModel } from '@nodeswork/sbase/mongoose';

export class User extends NModel {
}

export class Post extends NModel {
  @DBRef('User') author: mongoose.Types.ObjectId | models.User;
}
```

**DBRefArray**

`@DBRefArray` allows to reference to other model in a list.

```Typescript
import { DBRefArray, NModel } from '@nodeswork/sbase/mongoose';

export class User extends NModel {
}

export class Post extends NModel {
  @DBRef('User') authors: Array<mongoose.Types.ObjectId | models.User>;
}
```

**Default**

`@Default` provides default value for the field.

```Typescript
import { Default, NModel } from '@nodeswork/sbase/mongoose';

export class User extends NModel {
  @Default(false) active: boolean;
}
```

**Enum**

```Typescript
import { Enum, NModel } from '@nodeswork/sbase/mongoose';

export enum UserAuthMethod {
  EMAIL = 'EMAIL',
  FACEBOOK = 'FACEBOOK',
  GOOGLE = 'GOOGLE',
}

export class User extends NModel {
  @Enum(UserAuthMethod) authMethod: UserAuthMethod;
}
```

**IndexField**

`@IndexField` builds index on the target field.

```Typescript
import { NModel, Required } from '@nodeswork/sbase/mongoose';

export class User extends NModel {
  @IndexField() email: string;
}
```

**Required**

`@Required` marks the target as a required field.

```Typescript
import { NModel, Required } from '@nodeswork/sbase/mongoose';

export class User extends NModel {
  @Required() email: string;
}
```

**Unique**

`@Unique` marks the target as a unique field.

```Typescript
import { NModel, Unique } from '@nodeswork/sbase/mongoose';

export class User extends NModel {
  @Unique() email: string;
}
```

### Nested Reference

Nested schema can be defined separately and shared or referenced by other
models.

```Typescript
import { Config, Field, Model, NModel } from '@nodeswork/sbase/mongoose';

@Config({
  _id: false,
})
export class UserProfile extends Model {
  @Field() phone: string;
  @Field() address: string;
}

export class User extends NModel {
  @Field() profile: UserProfile;
}

```

### Indexes

Indexes can be defined either through `@Unique` decorator on properties or
`@Index` decorator on model class.

```Typescript
import { Config, Field, Index, NModel, Unique } from '@nodeswork/sbase/mongoose';

@Config({
  collections: 'users',
})
@Index({
  fields: {
    firstName: 1,
    lastName: 1,
  },
  options: {
    unique: false,
  },
})
export class User extends NModel {
  @Unique() email: string;

  @Field() firstName: string;
  @Field() lastName: string;
}

```

### Hooks

`@Pre`, `@Post`, `@Pres`, and `@Posts` allow to add hooks to the model.

```Typescript
import { Config, Default, Pre, Pres, NModel } from '@nodeswork/sbase/mongoose';

@Config({
  collections: 'users',
})
@Pre({
  name: 'save',
  fn: () => this.saveVersion++,
})
@Pres(['save', 'update'], {
  fn: () => this.allUpdateVersion++,
})
export class User extends NModel {
  @Default(0) saveVersion: number;
  @Default(0) allUpdateVersion: number;
}

```

### Plugins

`@Plugin` allows to extend the model with normal Mongoose plugins.

```Typescript
import { Config, NModel, Plugin } from '@nodeswork/sbase/mongoose';

@Config({
  collections: 'users',
})
@Plugin({
  fn: () => {}, // plugin logic
})
export class User extends NModel {
}

```

### Data Levels

Data fields can be grouped by pre-defined levels, and the level can be used as a
short-cut for projecting, while either retrieving the model instances or calling
instance `toJSON()` method.

For example, suppose there are three levels of data for `User` model: 1) Basic
info; 2) Detail info; 3) Credentials.  Below is the model definitions and sample
usages.

```Typescript
import { Config, Field, Level, NModel } from '@nodeswork/sbase/mongoose';

export enum UserDataLevel {
  BASIC = 'BASIC',
  DETAIL = 'DETAIL',
  CREDENTIAL = 'CREDENTIAL',
}

@Config({
  collections: 'users',
  dataLevel: {
    levels: UserDataLevel,
    default: UserDataLevel.BASIC,
  },
})
export class User extends NModel {

  @Field() email: string;

  @Level(UserDataLevel.BASIC) username: string;

  @Level(UserDataLevel.DETAIL) bio: string;

  @Level(UserDataLevel.CREDENTIAL) password:   string
}

```

```Typescript

await User.find({} /* query */, null /* field projection */, {
  level: UserDataLevel.BASIC,
});  // returns email and username

await User.find({} /* query */, null /* field projection */, {
  level: UserDataLevel.DETAIL,
});  // returns email, username, and bio

const user = await User.find({} /* query */, null /* field projection */, {
  level: UserDataLevel.CREDENTIAL,
});  // returns email, username, bio, and password

const userJson = user.toJSON({
  level: UserDataLevel.DETAIL,
}); // returns email, username, and bio.

```

### Koa Middlewares

### Api Level
