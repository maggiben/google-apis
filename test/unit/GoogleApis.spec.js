import { expect } from 'chai';
import { showInfo, getInfo } from '../../src';

describe('Nono', () => {

  it('should work', function() {
    const variable = 99;
    expect(variable).to.equal(99);
  });

  it('should timeout', function(done) {
    setTimeout(function () {
      return done();
    }, 2000)
  });

  it('should getInfo', function(done) {
    getInfo().then(function () {
      return done();
    })
  });

});
