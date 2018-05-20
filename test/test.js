const utilEntries = require('../api/entries/util-entries');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

const expect = chai.expect;
const assert = chai.assert;
chai.should();

describe('isEmpty', () => {
  let testv;
  it('should return false when the value is a string', () => {
    testv = utilEntries.isEmpty('Test');
    expect(testv).to.be.false;
  });
  it('should return true when the value is a numeric value', () => {
    testv = utilEntries.isEmpty(123);
    expect(testv).to.be.true;
  });
  it('should return true when the value is a boolean value', () => {
    testv = utilEntries.isEmpty(true);
    expect(testv).to.be.true;
    testv = utilEntries.isEmpty(false);
    expect(testv).to.be.true;
  });
  it('should return true when the value is emtpy value', () => {
    testv = utilEntries.isEmpty();
    expect(testv).to.be.true;
  });
  it('should return true when the value is undefined value', () => {
    testv = utilEntries.isEmpty(undefined);
    expect(testv).to.be.true;
  });
  it('should return false when the value is an array', () => {
    testv = utilEntries.isEmpty(['a', 'b']);
    expect(testv).to.be.false;
  });
});
// assert('foo' !== 'bar', 'foo is not bar')
// assert(Array.isArray([]), 'empty arrays are arrays')
describe('test utilEntries.getBusytimeByDate()', () => {
  let db;
  before(() => {
    // console.log('BEFORE')
    db = require('../db');
  });
  it('response array should have length of 0', () => utilEntries.getAllByDate(-1).should.eventually.have.length(0));
  it('response array should have length of 2', () => utilEntries.getAllByDate(1393455600000).should.eventually.have.length(2));
  it('response array should have length of 0', () => utilEntries.getAllByDate(0).should.eventually.have.length(0));

  after(() => {
    db.closeConnection();
  });
});
