/* eslint-disable max-len */
require('./init');
const Chai = require('chai');
const Mocha = require('mocha');

const { describe, it } = Mocha;
const { expect, assert } = Chai;

const util = require('../api/admin/util-toggles');

describe('test util.getAllToggles', () => {
  it('load all toggles', async () => {
    try {
      const result = await util.getAllToggles();
      expect(result).to.be.an('array');
      expect(result[0]).not.to.be.empty;
      expect(result[0]).to.have.property('toggle');
      expect(result[0]).to.have.property('name');
    } catch (error) {
      assert.fail('should not throw exception');
    }
  });
});

describe('test util.getToggle', () => {
  it('load one toggle', async () => {
    try {
      const result = await util.getAllToggles();
      const toggle = await util.getToggle(result[0].id);
      expect(toggle).to.have.property('toggle');
      expect(toggle).to.have.property('name');
    } catch (error) {
      assert.fail('should not throw exception');
    }
  });

  it('load one not existing toggle; should fail', async () => {
    expect(await util.getToggle('777777777777777777777777')).to.be.null;
  });

  it('test to load notification toggle by existing name', async () => {
    try {
      const result = await util.getToggleByName('CREATE_ENTRY');
      expect(result.name).to.equal('CREATE_ENTRY');
    } catch (error) {
      assert.fail('should not throw exception');
    }
  });
  it('test to load notification toggle by a not existing name', async () => {
    try {
      const result = await util.getToggleByName('xxx');
      expect(result).to.be.null;
    } catch (error) {
      assert.fail('should not throw exception');
    }
  });
  it('test to load notification toggle without any name (null)', async () => {
    try {
      const result = await util.getToggleByName();
      expect(result).to.be.null;
    } catch (error) {
      assert.fail('should not throw exception');
    }
  });
});

describe('test util.updateToggle', () => {
  it('update existing toggle', async () => {
    const toggleName = getToggleTestName();
    notification = 'DELETE_ME';

    try {
      const newToggle = await util.createToggle(toggleName, false, notification);
      expect(newToggle.toggle).to.equal(false);
      const toggle = await util.updateToggle(newToggle._id, true, `${notification}_TOO`);
      const result = await util.getToggle(toggle._id);
      expect(result).not.to.be.null;
      expect(result.toggle).to.equal(true);
      expect(result.notification).to.equal(`${notification}_TOO`);
    } catch (error) {
      assert.fail('should not throw exception');
    }
  });
  it('update existing toggle but only notification text', async () => {
    const toggleName = getToggleTestName();
    notification = 'DELETE_ME';
    try {
      const newToggle = await util.createToggle(toggleName, false, notification);
      expect(newToggle.toggle).to.equal(false);
      const toggle = await util.updateToggle(newToggle._id, undefined, `${notification}_TOO`);
      const result = await util.getToggle(toggle._id);
      expect(result).not.to.be.null;
      expect(result.notification).to.equal(`${notification}_TOO`);
    } catch (error) {
      assert.fail('should not throw exception');
    }
  });

  it('update not existing toggle', async () => {
    try {
      const toggle = await util.updateToggle('41224d776a326fb40f000001', true);
      expect(toggle).to.be.null;
    } catch (error) { assert.fail('should not throw exception'); }
  });
});

describe('test util.deleteToggle', () => {
  const toggleName = getToggleTestName();
  it('delete an existing toggle', async () => {
    try {
      const newToggle = await util.createToggle(toggleName, 'true');
      const deletedToggle = await util.deleteToggle(newToggle._id);
      const result = await util.getToggle(deletedToggle._id);
      expect(result).to.be.null;
    } catch (error) {
      console.error(error);
      assert.fail('should not throw exception');
    }
  });

  it('try to delete a not existing toggle', async () => {
    expect(await util.deleteToggle('41224d776a326fb40f000001')).to.be.null;
  });

  describe('test util.getToggleStatus', () => {
    it('check Slack status without SLACK_URL', async () => {
      process.env.SLACK_URL = '';

      try {
        const result = await util.getToggleStatus();
        expect(result).to.have.property('NOTIFICATION_SLACK');
        expect(result.NOTIFICATION_SLACK).to.equal(false);
      } catch (error) {
        console.log(error);
        assert.fail('should not throw exception');
      }
    });
    it('check Slack status with SLACK_URL', async () => {
      process.env.SLACK_URL = '1234567890';
      try {
        const result = await util.getToggleStatus();
        expect(result).to.have.property('NOTIFICATION_SLACK');
        expect(result.NOTIFICATION_SLACK).to.equal(true);
      } catch (error) {
        console.log(error);
        assert.fail('should not throw exception');
      }
    });
  });

  describe('test util.createToggle', () => {
    it('creating a new toggle with name, that does not exist without toggle value', async () => {
      const toggleName = getToggleTestName();

      try {
        const result = await util.createToggle(toggleName);
        expect(result).to.have.property('toggle');
        expect(result.toggle).to.equal(false); // Default value is "false"
        expect(result).to.have.property('name');
        expect(result.name).to.equal(toggleName);
        expect(result).to.have.property('notification');
        expect(result.notification).to.equal('generic message');
      } catch (error) {
        assert.fail('should not throw exception');
      }
    });

    it('creating a new toggle with name, that does not exist with given toggle value', async () => {
      const toggleName = getToggleTestName();

      try {
        const result = await util.createToggle(toggleName, true);
        expect(result).to.have.property('toggle');
        expect(result.toggle).to.equal(true); // Default value is "false"
        expect(result).to.have.property('name');
        expect(result.name).to.equal(toggleName);
        expect(result).to.have.property('notification');
        expect(result.notification).to.equal('generic message');
      } catch (error) {
        assert.fail('should not throw exception');
      }
    });

    it('creating a new toggle with name, notification text that does not exist with given toggle value', async () => {
      const toggleName = getToggleTestName();

      try {
        const result = await util.createToggle(toggleName, true, 'DELETE_ME');
        expect(result).to.have.property('toggle');
        expect(result.toggle).to.equal(true); // Default value is "false"
        expect(result).to.have.property('name');
        expect(result.name).to.equal(toggleName);
        expect(result).to.have.property('notification');
        expect(result.notification).to.equal('DELETE_ME');
      } catch (error) {
        assert.fail('should not throw exception');
      }
    });

    it('creating a new toggle without name; should fail', async () => {
      try { await util.createToggle(); assert.fail('should throw exception name: Path `name` is required'); } catch (error) { expect(error.message).to.eq('Toggle validation failed: name: Path `name` is required.'); }
    });
    it('creating a new toggle with empty name; should fail', async () => {
      try { await util.createToggle(''); assert.fail('should throw exception name: Path `name` is required'); } catch (error) { expect(error.message).to.eq('Toggle validation failed: name: Path `name` is required.'); }
    });
    it('creating a new toggle without name but toggle; should fail', async () => {
      try { await util.createToggle('', true); assert.fail('should throw exception name: Path `name` is required'); } catch (error) { expect(error.message).to.eq('Toggle validation failed: name: Path `name` is required.'); }
    });
  });

  after(async () => {
    try {
      const result = await util.deleteTestToggles();
      console.log(JSON.stringify(result));
    } catch (error) {
      assert.fail('should not throw exception');
    }
  });
});

function getToggleTestName() {
  return `TEST-TOGGLE-${Math.round(Math.random() * 100000000)}`;
}
