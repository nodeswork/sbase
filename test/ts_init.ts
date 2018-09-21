import * as mongoose from 'mongoose';

mongoose.connect('mongodb://localhost:27017/test', {
  useNewUrlParser: true,
});
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);
