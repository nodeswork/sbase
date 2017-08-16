sbase = require '../../dist'

describe 'nmodel', ->

  class UserModel extends sbase.mongoose.NModel

    @Schema {
      username: String
    }

    @Config {
      collection: 'collection'
    }

    @registor: () ->

    isAdmin: () ->

  Object.defineProperty UserModel::, 'fullname', {
    get: () -> '123'
  }


  User = UserModel.$register()

  it 'has correct setup for User', ->

    User.findOne.should.be.ok()
    user = new User()
    user.save.should.be.ok()

    User.schema.should.be.ok()
    User.schema.obj.username.should.be.ok()

    User.collection.collectionName.should.be.equal 'collection'

    User.registor.should.be.ok()
    user.isAdmin.should.be.ok()
    user.fullname.should.be.equal '123'

  class EmailUserModel extends UserModel

    @Schema {
      email: String
    }

    @Config {
      emailConfig: 'emailConfig'
    }

    @registor2: () ->

    isAdmin2: () ->

  Object.defineProperty EmailUserModel::, 'fullname2', {
    get: () -> '123'
  }
  EmailUser = EmailUserModel.$register()

  it 'has correct setup for EmailUser', ->

    EmailUser.findOne.should.be.ok()
    user = new EmailUser()
    user.save.should.be.ok()

    EmailUser.schema.should.be.ok()
    EmailUser.schema.obj.username.should.be.ok()
    EmailUser.schema.obj.email.should.be.ok()

    EmailUser.collection.collectionName.should.be.equal 'collection'

    EmailUser.registor.should.be.ok()
    EmailUser.registor2.should.be.ok()
    user.isAdmin.should.be.ok()
    user.isAdmin2.should.be.ok()
    user.fullname.should.be.equal '123'
    user.fullname2.should.be.equal '123'
