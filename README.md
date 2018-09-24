# @nodeswork/sbase

SBase is a user-friendly Typescript wrapper on top of Mongoose and KOA2.

## Features

It maps the db model to a Typescript class, the db schema to the class
properties, and the methods to the class methods so that all the model
configuration code is organized in a centralized place and the models have
distinct property types. It also supports model inheritance and mixin so that
common logic can be abstracted out. It has some useful pre-defined model
extensions, such as auto-generate timestamp, KOA2 middlewares, etc.

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

### Field Definitions

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

**Enum**

```Typescript
import { Enum } from '@nodeswork/sbase/mongoose';

export enum UserAuthMethod {
  EMAIL = 'EMAIL',
  FACEBOOK = 'FACEBOOK',
  GOOGLE = 'GOOGLE',
}

export class User extends NModel {
  @Enum(UserAuthMethod) authMethod: UserAuthMethod;
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
