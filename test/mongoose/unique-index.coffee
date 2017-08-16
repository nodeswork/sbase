sbase = require '../../dist'


describe 'nmodel', ->

  class Base extends sbase.mongoose.NModel

    @$CONFIG = {
      collection: 'sbase.collection'
      discriminatorKey: 'kind'
    }

    @$SCHEMA = {
      globalUnique: {
        type:    String
        unique:  true
      }
    }


  class Extend extends Base

    @$SCHEMA = {
      localUnique: {
        type:    String
        unique:  true
      }
    }

  Base    = Base.$register()
  Extend  = Extend.$register()

  beforeEach () ->
    await Base.remove({})

  it 'disallow to create two global keys', ->

    await Base.create({
      globalUnique: 'a'
    })

    try
      await Base.create({
        globalUnique: 'a'
      })
      true.should.not.be.ok()
    catch e
      e.code.should.be.equal 11000

  it 'allow to create two local key', ->

    await Extend.create({
      globalUnique: 'a'
      localUnique: '1'
    })

    await Extend.create({
      globalUnique: 'b'
      localUnique: '1'
    })

  it 'disallow to create two local keys', ->

    await Extend.create({
      globalUnique: 'a'
      localUnique: '1'
    })

    try
      await Extend.create({
        globalUnique: 'a'
        localUnique: '1'
      })
      true.should.not.be.ok()
    catch e
      e.code.should.be.equal 11000
