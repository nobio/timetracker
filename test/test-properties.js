const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;
const util = require('../api/admin/util-properties');

describe('test properties', () => {
  it('set a property and try to read it', () => {
    util.getToggleStatus()
      .then((result) => {
        expect(result).to.have.property('NOTIFICATION_SLACK');
        expect(result.NOTIFICATION_SLACK).to.equal(false);
      });
  });
  it('check Slack status with SLACK_TOKEN', () => {
    process.env.SLACK_TOKEN = '1234567890';
    util.getToggleStatus()
      .then((result) => {
        expect(result).to.have.property('NOTIFICATION_SLACK');
        expect(result.NOTIFICATION_SLACK).to.equal(true);
      });
  });
});
