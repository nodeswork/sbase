should = require 'should'

sbase = require '../../dist'

describe 'model', ->

  class DAModel extends sbase.mongoose.NModel

    @Config {
      collection: 'sbase.dataLevels'
      discriminatorKey: 'kind'
      levels: [ '1', '2' ]
    }

    @Schema {
      data1:
        type: String
        level: '1'

      data2:
        type: String
        level: '2'
    }

  class DBModel extends DAModel

    @Schema {
      sub1:
        type: String
        level: '1'
      sub2:
        type: String
        level: '2'
    }

  DAModel = DAModel.$register()
  DBModel = DBModel.$register()

  beforeEach ->
    await DAModel.remove()

    await DAModel.create({
      data1: 'a'
      data2: 'a'
      sub1: 'a'
      sub2: 'a'
    })

    await DBModel.create({
      data1: 'b'
      data2: 'b'
      sub1: 'b'
      sub2: 'b'
    })

  it 'returns level 1 only', ->

    x = await DAModel.findOne(data1: 'a')
    x.data1.should.be.equal 'a'
    x.data2.should.be.equal 'a'
    should(x.sub1).not.be.ok()
    should(x.sub2).not.be.ok()

    x = await DAModel.findOne({data1: 'a'}, {}, {level: '1'})
    x.should.be.instanceof DAModel
    x.should.not.be.instanceof DBModel
    x.data1.should.be.equal 'a'
    should(x.data2).not.be.ok()
    should(x.sub1).not.be.ok()
    should(x.sub2).not.be.ok()

    x = await DAModel.findOne({data1: 'b'}, {}, {level: '1'})
    x.should.not.be.instanceof DAModel
    x.should.be.instanceof DBModel
    x.data1.should.be.equal 'b'
    should(x.data2).not.be.ok()
    x.sub1.should.be.ok()
    should(x.sub2).not.be.ok()
