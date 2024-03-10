require('./init');
const chai = require('chai');
const util = require('../api/entries/util-entries');

const { expect } = chai;

describe('isEmpty ', () => {
  let testv;
  it('should return false when the value is a string', () => {
    testv = util.isEmpty('Test');
    expect(testv).to.be.false;
  });
  it('should return true when the value is a numeric value', () => {
    testv = util.isEmpty(123);
    expect(testv).to.be.true;
  });
  it('should return true when the value is a boolean value', () => {
    testv = util.isEmpty(true);
    expect(testv).to.be.true;
    testv = util.isEmpty(false);
    expect(testv).to.be.true;
  });
  it('should return true when the value is emtpy value', () => {
    testv = util.isEmpty();
    expect(testv).to.be.true;
  });
  it('should return true when the value is undefined value', () => {
    testv = util.isEmpty(undefined);
    expect(testv).to.be.true;
  });
  it('should return false when the value is an array', () => {
    testv = util.isEmpty(['a', 'b']);
    expect(testv).to.be.false;
  });
});

describe('test stripdownToDateBerlin method', () => {
  it('should remove time component', () => expect(util.stripdownToDateBerlin(1393455600031).format('HH:mm:ss')).to.equal('00:00:00'));
  it('should have date component', () => expect(util.stripdownToDateBerlin(1000000000000).format('YYYY-MM-DD')).to.equal('2001-09-09'));
  it('should have date Europe/Berlin timezone', () => expect(util.stripdownToDateBerlin(1000000000000)._z.name).to.equal('Europe/Berlin'));
  it('should parse timestamp 0', () => expect(util.stripdownToDateBerlin(0).format('YYYY-MM-DD HH:mm:ss')).to.equal('1970-01-01 00:00:00'));
  it('should parse negative timestamp to timestamp 0', () => expect(util.stripdownToDateBerlin(-999).format('YYYY-MM-DD HH:mm:ss')).to.equal('1970-01-01 00:00:00'));
});
