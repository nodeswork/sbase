import * as should from 'should';
import * as _ from 'underscore';

import * as sbase from '../../src';

@sbase.mongoose.Config({
  collection: 'sbase.tests.events',
  discriminatorKey: 'kind',
})
export class EventModel extends sbase.mongoose.A7Model {
  @sbase.mongoose.Field()
  name: string;
}

export class ClickEventModel extends sbase.mongoose.A7Model {
  @sbase.mongoose.Default(0)
  posX: number;

  @sbase.mongoose.Default(0)
  posY: number;
}

const Event = EventModel.$registerA7Model();
type Event = EventModel;

const ClickEvent = Event.$discriminatorA7Model(ClickEventModel);
type ClickEvent = ClickEventModel & EventModel;

describe('Discriminator model', () => {
  beforeEach(async () => {
    await Event.deleteMany({});
  });

  it('saves general event', async () => {
    const e = await Event.create({
      name: 'general event',
      posX: 0,
      posY: 0,
    });

    e.name.should.be.equal('general event');
    should((e as any).posX).be.undefined();
  });

  it('saves click event', async () => {
    const e = await ClickEvent.create({
      name: 'general event',
      posX: 0,
      posY: 0,
    });
    e.name.should.be.equal('general event');
    e.posX.should.be.equal(0);

    const e1 = await ClickEvent.find();
    e1.length.should.be.equal(1);

    const e2 = await Event.find({});
    e2.length.should.be.equal(1);
    (e2[0] as ClickEvent).posX.should.be.equal(0);
    e2[0].should.be.instanceof(ClickEvent);
  });
});
