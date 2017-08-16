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

  it 'has correct setup', ->

    User.findOne.should.be.ok()
    user = new User()
    user.save.should.be.ok()

    User.schema.should.be.ok()
    User.schema.obj.username.should.be.ok()

    User.collection.collectionName.should.be.equal 'collection'

    User.registor.should.be.ok()
    user.isAdmin.should.be.ok()
    user.fullname.should.be.equal '123'
