sbase = require '../../dist'

describe 'model', ->

  class DModel extends sbase.mongoose.Model

    x: () -> 'x'

  class BModel extends sbase.mongoose.Model

    foo: () -> 'BModel'
    bar: () -> 'bar'

    @Mixin DModel

  class CModel extends sbase.mongoose.Model

    foo: () -> 'CModel'

    @Mixin DModel

  class AModel extends sbase.mongoose.Model

    @Schema {
      username: String
    }

    @Config {
      collection: 'sbase.mixin'
      discriminatorKey: 'kind'
    }

    foo: () -> 'AModel'

    @Mixin BModel
    @Mixin CModel

  Model = AModel.$register()

  describe 'mixin', ->

    it 'has right methods', ->

      AModel._mongooseOptions.methods.should.have.length 5
      m = new Model()

      m.x().should.be.equal 'x'
      m.foo().should.be.equal 'AModel'
      m.bar().should.be.equal 'bar'
