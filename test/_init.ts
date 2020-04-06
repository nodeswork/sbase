import * as mongoose from 'mongoose';

import { sbaseMongooseConfig } from '../src/mongoose';

mongoose.connect(
  'mongodb://localhost:27017/test',
  {
    useNewUrlParser: true,
  },
);
mongoose.set('debug', true);
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);

sbaseMongooseConfig.multiTenancy.uris = 'mongodb://localhost:27017/test';
sbaseMongooseConfig.multiTenancy.options = {
  useNewUrlParser: true,
};
sbaseMongooseConfig.multiTenancy.enabled = true;
sbaseMongooseConfig.multiTenancy.defaultCollectionNamespace = 'public';
sbaseMongooseConfig.multiTenancy.tenants = ['mtTest'];

sbaseMongooseConfig.multiTenancy.onMongooseInstanceCreated = (mi) => {
  mi.set('useCreateIndex', true);
  mi.set('useFindAndModify', false);
};
