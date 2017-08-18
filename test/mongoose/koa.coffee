mongoose  = require 'mongoose'
should    = require 'should'

sbase     = require '../../dist'

describe 'model', ->


  class KoaModelA extends sbase.mongoose.NModel

    @Config {
      collection: 'sbase.koas.modelA'
      discriminatorKey: 'kind'
      levels: [ '1', '2' ]
    }

    @Schema {
      dataA1: {
        type:   String
        level:  '1'
      }
      dataA2: {
        type:   String
        level:  '2'
      }
    }

  class KoaModelB extends sbase.mongoose.NModel

    @Config {
      collection: 'sbase.koas.modelB'
      discriminatorKey: 'kind'
      levels: [ '1', '2' ]
    }

    @Schema {
      refA: {
        type:               mongoose.Schema.ObjectId
        ref:                'KoaModelA'
      }
      dataB1: {
        type:   String
        level:  '1'
      }
      dataB2: {
        type:   String
        level:  '2'
      }
    }

  KoaModelA = KoaModelA.$register()
  KoaModelB = KoaModelB.$register()

  objects = {}

  beforeEach ->
    await KoaModelA.remove()
    await KoaModelB.remove()

    objects.a1 = await KoaModelA.create({
      dataA1: 'a1', dataA2: 'a2'
    })

  describe '#getMiddleware', ->

    it 'has the right name', ->
      m = KoaModelA.getMiddleware({ field: 'field' })
      m.should.be.ok()
      m.name.should.be.equal 'KoaModelA#getMiddleware'

    it 'returns original data', ->
      m    = KoaModelA.getMiddleware({ field: 'field' })
      ctx  = { params: field: objects.a1._id }
      next = () ->

      await m(ctx, next)
      ctx.object.toJSON().should.be.deepEqual objects.a1.toJSON()
      ctx.body.toJSON().should.be.deepEqual objects.a1.toJSON()

    it 'returns triggers next', ->
      m    = KoaModelA.getMiddleware({
        field:        'field'
        triggerNext:  true
      })
      ctx      = { params: field: objects.a1._id }
      calls    = 0
      next     = () ->
        calls += 1

      await m(ctx, next)
      calls.should.be.equal 1

    it 'respect overrides.query', () ->
      m    = KoaModelA.getMiddleware({
        field:        'field'
      })
      ctx      = {
        params: field: objects.a1._id
        overrides: query: dataA1: 'not'
      }
      next     = () ->

      try
        await m(ctx, next)
        should.fail()
      catch e
        e.meta.responseCode.should.be.equal 404

    it 'respect level', () ->
      m    = KoaModelA.getMiddleware({
        field:        'field'
        level:        '1'
      })
      ctx      = {
        params: field: objects.a1._id
      }
      next     = () ->

      await m(ctx, next)
      should(ctx.object.dataA2).not.be.ok()
      ctx.object.dataA1.should.be.equal objects.a1.dataA1
