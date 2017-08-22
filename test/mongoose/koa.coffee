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
        type:      String
        level:     '1'
        required:  true
      }
      dataA2: {
        type:   String
        level:  '2'
      }
      dataA3: {
        type:     String
        api:      sbase.mongoose.AUTOGEN
        default:  'dataA3'
      }
      dataA4: {
        type:     String
        api:      sbase.mongoose.READONLY
        default:  'dataA4'
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

  class KoaModelAA extends KoaModelA

  KoaModelA   = KoaModelA.$register()
  KoaModelB   = KoaModelB.$register()
  KoaModelAA  = KoaModelAA.$register()

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

  describe '#createMiddleware', ->

    it 'has the right name', ->
      m = KoaModelA.createMiddleware({ allowCreateFromParentModel: true })
      m.should.be.ok()
      m.name.should.be.equal 'KoaModelA#createMiddleware'

    it 'creates successfully', ->
      m = KoaModelA.createMiddleware({ allowCreateFromParentModel: true })
      ctx  = request: body: {
        dataA1: 'c1'
        dataA3: 'c3'
        dataA4: 'c4'
      }
      next = () ->
      await m(ctx, next)

      ctx.object.dataA1.should.be.equal 'c1'
      should(ctx.object.dataA2).not.be.ok()
      ctx.object.dataA3.should.be.equal 'dataA3'
      ctx.object.dataA4.should.be.equal 'c4'

    it 'throw error when missing required key', ->

      m = KoaModelA.createMiddleware({ allowCreateFromParentModel: true })
      ctx  = request: body: {
        dataA3: 'c3'
        dataA4: 'c4'
      }
      next = () ->
      try
        await m(ctx, next)
        should.fail()
      catch e
        e.errors.dataA1.kind.should.be.equal 'required'

    it 'projects fields', ->

      m = KoaModelA.createMiddleware({
        level: '1', allowCreateFromParentModel: true
      })
      ctx  = request: body: {
        dataA1: 'c1'
        dataA2: 'c2'
        dataA3: 'c3'
        dataA4: 'c4'
      }
      next = () ->
      await m(ctx, next)

      ctx.object.dataA1.should.be.equal 'c1'
      should(ctx.object.dataA2).not.be.ok()
      ctx.object.dataA3.should.be.equal 'dataA3'
      ctx.object.dataA4.should.be.equal 'c4'

    it 'throws exeception without discriminatorKey', ->
      m = KoaModelA.createMiddleware({
        level: '1'
      })
      ctx  = request: body: {
        dataA1: 'c1'
        dataA2: 'c2'
      }
      next = () ->
      try
        await m(ctx, next)
        should.fail()
      catch e
        e.meta.should.have.properties {
          responseCode: 422
          path: 'kind'
        }

    it 'allows create from sub model', ->
      m = KoaModelA.createMiddleware({
        level: '1'
      })
      ctx  = request: body: {
        kind: 'KoaModelAA'
        dataA1: 'c1'
        dataA2: 'c2'
      }
      next = () ->
      await m(ctx, next)
      ctx.object.should.have.properties {
        kind: 'KoaModelAA',
        dataA1: 'c1',
        dataA4: 'dataA4',
        dataA3: 'dataA3',
      }
      should(ctx.object.dataA2).not.be.ok()

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

  describe '#updateMiddleware', ->

    it 'has the right name', ->
      m = KoaModelA.updateMiddleware({})
      m.should.be.ok()
      m.name.should.be.equal 'KoaModelA#updateMiddleware'

    it 'returns updated data', ->
      m    = KoaModelA.updateMiddleware({ field: 'field' })
      ctx  = {
        params:
          field: objects.a1._id
        request:
          body:
            dataA1: 'c1'
            data_X: 'c3'
      }
      next = () ->

      await m(ctx, next)

      ctx.object.dataA1.should.be.equal 'c1'
      should(ctx.object.data_X).not.be.ok()

    it 'returns updated project data', ->
      m    = KoaModelA.updateMiddleware({
        field: 'field'
        project: [ 'dataA1' ]
      })
      ctx  = {
        params:
          field: objects.a1._id
        request:
          body:
            dataA1: 'c1'
            data_X: 'c3'
      }
      next = () ->

      await m(ctx, next)

      ctx.object.dataA1.should.be.equal 'c1'
      should(ctx.object.data_X).not.be.ok()
      should(ctx.object.dataA2).not.be.ok()

    it 'returns level data', ->
      m    = KoaModelA.updateMiddleware({
        field: 'field'
        level: '1'
      })
      ctx  = {
        params:
          field: objects.a1._id
        request:
          body:
            dataA1: 'c1'
            data_X: 'c3'
      }
      next = () ->

      await m(ctx, next)

      ctx.object.dataA1.should.be.equal 'c1'
      should(ctx.object.data_X).not.be.ok()
      should(ctx.object.dataA2).not.be.ok()

    it 'could not update _id', ->
      m    = KoaModelA.updateMiddleware({
        field: 'field'
        level: '1'
      })
      ctx  = {
        params:
          field: objects.a1._id
        request:
          body:
            _id:    'other things'
            dataA1: 'c1'
            data_X: 'c3'
      }
      next = () ->

      await m(ctx, next)

      ctx.object.dataA1.should.be.equal 'c1'
      should(ctx.object.data_X).not.be.ok()
      should(ctx.object.dataA2).not.be.ok()
      ctx.object._id.toString().should.be.deepEqual objects.a1._id.toString()

    it 'could not update AUTOGEN and READONLY fields', ->
      m    = KoaModelA.updateMiddleware({
        field: 'field'
        level: '1'
      })
      ctx  = {
        params:
          field: objects.a1._id
        request:
          body:
            _id:    'other things'
            dataA1: 'c1'
            data_X: 'c3'
            dataA3: 'c3'
            dataA4: 'c4'
      }
      next = () ->

      await m(ctx, next)

      ctx.object.dataA1.should.be.equal 'c1'
      should(ctx.object.data_X).not.be.ok()
      should(ctx.object.dataA2).not.be.ok()
      ctx.object._id.toString().should.be.deepEqual objects.a1._id.toString()
      ctx.object.dataA3.should.be.equal 'dataA3'
      ctx.object.dataA4.should.be.equal 'dataA4'
