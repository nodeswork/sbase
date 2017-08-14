{ NodesworkMongooseSchema } = require '../dist'

describe 'mongoose-schema', ->

  it 'set schema for each class', ->

    NodesworkMongooseSchema.MongooseSchema().should.be.ok()
