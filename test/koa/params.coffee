should    = require 'should'

sbase     = require '../../dist'

describe 'koa.params', ->

  describe '#Boolean', ->

    it 'converts to boolean value', ->

      for x in ['1', 'true', 1, true]
        sbase.koa.filters.Boolean(x).should.be.true()

      for x in ['0', 'false', 0, false]
        sbase.koa.filters.Boolean(x).should.be.false()

      for x in [undefined, null]
        should(sbase.koa.filters.Boolean(x)).be.null()

      for x in ['', 'unknown']
        (() -> sbase.koa.filters.Boolean(x))
          .should.throw 'Invalid boolean value'

  describe '#Integer', ->

    it 'converts to int value', ->

      for [val, exp] in [
        ['1', 1]
        ['2.1', 2]
        ['-10.1', -10]
        ['-10.9', -10]
      ]
        sbase.koa.filters.Integer(val).should.be.equal exp

      for val in ['xxx', 'unknown', '-']
        (() -> sbase.koa.filters.Integer(val))
          .should.throw 'Invalid integer value'

  describe '#Json', ->

    it 'converts to json value', ->

      for [val, exp] in [
        ['{}', {}]
        ['12', 12]
      ]
        sbase.koa.filters.Json(val).should.be.deepEqual exp

      for val in ['xxx', 'unknown', '-']
        (() -> sbase.koa.filters.Json(val))
          .should.throw 'Invalid json value'

  describe '#extract', ->

    it 'extracts value', ->
      extractor = sbase.koa.filters.extract('a.b.c')
      extractor(a: b: c: 100).should.be.equal 100
      should(extractor(a: b: d: 100)).be.not.ok()

  describe '#parse', ->

    it 'parses string', ->
      filter = sbase.koa.filters.parse('$a.b.c:Boolean')
      (await filter(a: b: c: 'true')).should.be.true()

    it 'throws correct', ->
      filter = sbase.koa.filters.parse('$a.b.c:Boolean')
      try
        (await filter(a: b: c: 'xxx'))
        should.fail()
      catch e
        e.message.should.be.equal 'Invalid boolean value'
        e.meta.should.have.properties {
          responseCode: 400,
          path: 'a.b.c',
          value: 'xxx'
        }

    it 'chains extractor', ->
      filter = sbase.koa.filters.parse(
        '$query:Json'
        '$a:Integer'
      )
      (await filter(query: '{"a": 100}')).should.be.equal 100

      try
        await filter(query: '{"b": 100}')
        should.fail()
      catch e
        e.message.should.be.equal 'Missing value'
        e.meta.should.have.properties {
          responseCode: 400,
          path: 'query.a',
        }
