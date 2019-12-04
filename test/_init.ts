import * as mongoose from 'mongoose';

import { sbaseMongooseConfig } from '../src/mongoose';

mongoose.connect(
  'mongodb://localhost:27017/test',
  {
    useNewUrlParser: true,
  },
);
mongoose.set('useCreateIndex', true);
mongoose.set('useFindAndModify', false);

sbaseMongooseConfig.multiTenancy.enabled = true;
sbaseMongooseConfig.multiTenancy.defaultCollectionNamespace = 'public';
sbaseMongooseConfig.multiTenancy.tenants = ['mtTest'];
