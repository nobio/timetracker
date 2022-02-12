require('./init');
const utilEntries = require('../api/entries/util-entries');
const g_util = require('../api/global_util');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { response } = require('express');
const { assert } = require('chai');

chai.use(chaiAsPromised);
const expect = chai.expect;
chai.should();

describe('test global_util.sendMessage()', () => {
  it('should not throw exception because SLACK URL is not set; response is some error message', async () => {
    process.env.SLACK_TOKEN = '';
    try {
      const response = await g_util.sendMessage('CREATE_ENTRY', 'XXXXXXX');
      //console.log(response)
      expect(response).to.be.string;
      expect(response).to.contains('toggle CREATE_ENTRY switched off');
    } catch (error) {
      console.log(error)
      assert.fail('should not throw exception')
    }
  });

  it('should work just fine with unknown key as promise', async () => {
    try {
      const result = await g_util.sendMessage('UNKNOWN_KEY', 'XXXXXXX');
      expect(result).to.not.be.undefined;
      expect(result).to.be.string;
      expect(result).to.equal('toggle UNKNOWN_KEY switched off');
    } catch (error) {
      assert.fail('should not throw exception')
    }
  });
});

// assert('foo' !== 'bar', 'foo is not bar')
// assert(Array.isArray([]), 'empty arrays are arrays')
describe('test utilEntries.getBusytimeByDate()', () => {
  it('response array should have length of 0', async () => expect(await utilEntries.getAllByDate(-1)).to.have.length(0));
  it('response array should have length of 2', async () => expect(await utilEntries.getAllByDate(1393455600000)).to.have.length(2));
  it('response array should have length of 0', async () => expect(await utilEntries.getAllByDate(0)).to.have.length(0));
});
