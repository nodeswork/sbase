import * as sbase from '../../src';

describe('decorator Field', () => {

  it('should work', () => {

    @sbase.mongoose.Config({
      collection: 'dt1s',
    })
    class DT1 extends sbase.mongoose.Model {

      @sbase.mongoose.Field({
        type: String,
      })
      public name: string;
    }

    (DT1.$mongooseOptions.schema as any).name.should.be.ok();
    (DT1.$mongooseOptions.config as any).collection.should.be.equal('dt1s');
  });
});
