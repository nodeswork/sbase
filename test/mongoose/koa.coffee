_         = require 'underscore'
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

  toJSON = (x) ->
    if _.isArray(x) then _.map x, (a) -> a.toJSON()
    else x.toJSON()

  deepJSONEqual = (a, b) ->
    toJSON(a).should.deepEqual toJSON(b)

  beforeEach ->
    await KoaModelA.remove()
    await KoaModelB.remove()

    objects.a1 = await KoaModelA.create({
      dataA1: 'a1_1', dataA2: 'a2_1'
    })

    objects.a2 = await KoaModelA.create({
      dataA1: 'a1_2', dataA2: 'a2_2'
    })

    objects.b1 = await KoaModelB.create({
      dataB1: 'b1_1', dataB2: 'b2_1', refA: objects.a1
    })

    objects.b2 = await KoaModelB.create({
      dataB1: 'b1_2', dataB2: 'b2_2', refA: objects.a2
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

    it 'populates ref object', () ->
      m    = KoaModelB.getMiddleware({
        field:      'field'
        populate:   [
          path:     'refA'
          options:
            level:  '1'
        ]
      })
      ctx      = {
        params: field: objects.b1._id
      }
      next     = () ->

      await m(ctx, next)

      ctx.object.refA.dataA1.should.be.ok()
      should(ctx.object.refA.dataA2).not.be.ok()

  describe '#findMiddleware', ->

    it 'has the right name', ->
      m = KoaModelA.findMiddleware({})
      m.should.be.ok()
      m.name.should.be.equal 'KoaModelA#findMiddleware'

    it 'returns multiple data', ->
      m    = KoaModelA.findMiddleware({})
      ctx  = {}
      next = () ->

      await m(ctx, next)
      deepJSONEqual ctx.object, [objects.a1, objects.a2]

    it 'returns works with pagination', ->
      m    = KoaModelA.findMiddleware({
        pagination: {
        }
      })

      ctx  = {
        request:
          query: {}
        response:
          set: (key, val) => ctx.response[key] = val
      }
      next = () ->

      await m(ctx, next)
      deepJSONEqual ctx.object, [objects.a1, objects.a2]

      ctx.response.total_page.should.be.equal '1'
