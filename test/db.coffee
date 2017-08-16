mongoose = require 'mongoose'

mongoose.connect('mongodb://localhost:27017/test', {
  useMongoClient: true
})
