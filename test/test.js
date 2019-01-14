const utilEntries = require('../api/entries/util-entries');
const g_util = require('../api/global_util');

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

describe('test global_util.sendMessage()', () => {

  it('should work just fine', async () => {
    await g_util.sendMessage('CREATE_ENTRY', 'XXXXXXX')
      .then()
      .catch((err) => { throw (err); });
  });

  it('should work just fine as promise', async () => {

    await g_util.sendMessage('CREATE_ENTRY', 'XXXXXXX')
      .then((result) => {
        expect(result).to.not.be.undefined;
        expect(result).to.be.string;
        /*
        expect(result).to.have.property('ok');
        expect(result.ok).to.equal(true);
        expect(result).to.have.property('channel');
        expect(result.channel).to.equal('CF5UTDCJE');
        expect(result).to.have.property('message');
        expect(result.message).to.have.property('type');
        expect(result.message.type).to.equal('message');
        expect(result.message).to.have.property('subtype');
        expect(result.message.subtype).to.equal('bot_message');
        expect(result.message).to.have.property('ts');
        expect(result.message.ts).to.not.be.empty;
        expect(result.message).to.have.property('username');
        expect(result.message.username).to.equal('Nobio Tech');
        expect(result.message).to.have.property('bot_id');
        expect(result.message.bot_id).to.not.be.empty;
        */
      })
      .catch((err) => {
        throw err;
      })
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

