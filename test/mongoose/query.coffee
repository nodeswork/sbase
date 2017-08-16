sbase = require '../../dist'


describe 'nmodel', ->

  class BaseQuery extends sbase.mongoose.NModel

    @$CONFIG = {
      collection: 'sbase.queries'
      discriminatorKey: 'kind'
    }

    @$SCHEMA = {
      baseKey: {
        type:    String
      }
    }


  class ExtendQuery extends BaseQuery

    @$SCHEMA = {
      localKey: {
        type:    String
      }
    }

  class AnotherQuery extends BaseQuery

    @$SCHEMA = {
      localKey: {
        type:    String
      }
    }

  BaseQuery    = BaseQuery.$register()
  ExtendQuery  = ExtendQuery.$register()
  AnotherQuery = AnotherQuery.$register()

  beforeEach () ->
    await BaseQuery.remove({})

    await BaseQuery.create({
      baseKey: 'a'
    })

    await BaseQuery.create({
      baseKey: 'b'
    })

    await ExtendQuery.create({
      baseKey: 'a'
      localKey: '1'
    })

    await ExtendQuery.create({
      baseKey: 'b'
      localKey: '2'
    })

    await AnotherQuery.create({
      baseKey: 'a'
      localKey: '1'
    })

    await AnotherQuery.create({
      baseKey: 'b'
      localKey: '2'
    })

  it 'returns all from base query', ->

    v = await BaseQuery.find({})
    v.should.have.length 6

  it 'sets discriminatorKey for extend query', ->

    v = await ExtendQuery.find({})
    v.should.have.length 2

    v = await ExtendQuery.find({baseKey: 'a'})
    v.should.have.length 1

  it 'sets discriminatorKey for another query', ->

    v = await AnotherQuery.find({})
    v.should.have.length 2

    v = await AnotherQuery.find({baseKey: 'a'})
    v.should.have.length 1
