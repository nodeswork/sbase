import { Validator, isStartOf } from '../../src/koa/validators';

describe('koa.validators', () => {
  function validate(validator: Validator, val: any) {
    return validator({}, 'foo', val, {});
  }
  describe('isStartOf', () => {
    it('should validate and return proper message', () => {
      validate(isStartOf('month'), '2019-01-01').should.be.true();
      validate(isStartOf('month'), '2019-01-02').should.be.equal('month');
    });

    it('should validate utc time', () => {
      validate(isStartOf('month', 'Etc/UTC'), '2020-04-01').should.be.true();
    });
  });
});
