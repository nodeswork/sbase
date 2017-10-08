sbase = require '../../dist'

describe 'nmodel', ->

  class BaseNModel extends sbase.mongoose.NModel

    @Config {
      collection: 'sbase.nmodels'
    }

    @Schema {
      name: String
    }

  BaseNModel = BaseNModel.$register()

  records = {}

  beforeEach () ->
    await BaseNModel.remove({})

    for i in [1..5]
      records["ins#{i}"] = await BaseNModel.create name: "ins#{i}"

  describe '#query', ->

    it 'returns all records', ->
      v = await BaseNModel.find()
      v.should.have.length 5

    # it 'returns undeleted records', ->
      # records.ins1.deleted = true
      # await records.ins1.save()
      # v = await BaseNModel.find()
      # v.should.have.length 4

    # it 'returns all records with deleted', ->
      # records.ins1.deleted = true
      # await records.ins1.save()
      # v = await BaseNModel.find({}, null, { withDeleted: true })
      # v.should.have.length 5

    # it 'use customized delete', ->
      # await records.ins1.delete()
      # v = await BaseNModel.find()
      # v.should.have.length 4
      # v = await BaseNModel.find({}, null, { withDeleted: true })
      # v.should.have.length 5

    # it 'blocks remove to be called', ->
      # try
        # await records.ins1.remove()
        # true.should.not.be.ok()
      # catch e
        # e.message.should.equal 'remove is not supported, use delete instead'
