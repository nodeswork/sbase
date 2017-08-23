should = require 'should'

sbase = require '../../dist'
{ UserModel } = require '../../dist/user'

describe 'user', ->

  it 'sets UserModel', ->

    console.log 'UserModel', UserModel
