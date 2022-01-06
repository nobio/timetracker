const fs = require('fs');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const expect = chai.expect;

const util = require('../api/admin/util-toggles');

describe('test util.getToggleStatus', () => {
  it('check Slack status without SLACK_TOKEN', () => {
    // console.log(process.env.SLACK_TOKEN);
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

describe('test util.createToggle', () => {
  it('creating a new toggle with name, that does not exist without toggle value', () => {
    const toggleName = getToggleTestName();

    util.createToggle(toggleName)
      .then((result) => {
        expect(result).to.have.property('toggle');
        expect(result.toggle).to.equal(false); // Default value is "false"
        expect(result).to.have.property('name');
        expect(result.name).to.equal(toggleName);
        expect(result).to.have.property('notification');
        expect(result.notification).to.equal('generic message');
      })
      .catch((err) => { throw err; });
  });

  it('creating a new toggle with name, that does not exist with given toggle value', () => {
    const toggleName = getToggleTestName();

    util.createToggle(toggleName, true)
      .then((result) => {
        expect(result).to.have.property('toggle');
        expect(result.toggle).to.equal(true); // Default value is "false"
        expect(result).to.have.property('name');
        expect(result.name).to.equal(toggleName);
        expect(result).to.have.property('notification');
        expect(result.notification).to.equal('generic message');
      })
      .catch((err) => { throw err; });
  });

  it('creating a new toggle with name, notification text that does not exist with given toggle value', () => {
    const toggleName = getToggleTestName();

    util.createToggle(toggleName, true, 'DELETE_ME')
      .then((result) => {
        expect(result).to.have.property('toggle');
        expect(result.toggle).to.equal(true); // Default value is "false"
        expect(result).to.have.property('name');
        expect(result.name).to.equal(toggleName);
        expect(result).to.have.property('notification');
        expect(result.notification).to.equal('DELETE_ME');
      })
      .catch((err) => { throw err; });
  });


  it('creating a new toggle without name; should fail', async () => expect(util.createToggle()).to.eventually.be.rejected);
  it('creating a new toggle without name; should fail', async () => expect(util.createToggle('')).to.eventually.be.rejected);
  it('creating a new toggle without name but toggle; should fail', async () => expect(util.createToggle('', true)).to.eventually.be.rejected);
});

describe('test util.getAllToggles', () => {
  it('load all toggles', () => {
    util.getAllToggles()
      .then((result) => {
        expect(result).to.be.an('array');
        expect(result[0]).not.to.be.empty;
        expect(result[0]).to.have.property('toggle');
        expect(result[0]).to.have.property('name');
      })
      .catch((err) => { throw err; });
  });
});

describe('test util.getToggle', () => {
  it('load one toggle', async () => {
    util.getAllToggles()
      .then(result => util.getToggle(result[0]._id))
      .then((result) => {
        expect(result).to.have.property('toggleXXX');
        expect(result).to.have.property('name');
      })
      .catch((err) => { throw err; });
  });

  it('load one not existing toggle; should fail', () => expect(util.getToggle('12345')).to.eventually.be.rejected);

  it('test to load notification toggle by existing name', () => {
    util.getToggleByName('CREATE_ENTRY')
      .then((result) => {
        expect(result.name).to.equal('CREATE_ENTRY');
      })
      .catch((err) => { throw err; });
  });
  it('test to load notification toggle by a not existing name', () => {
    util.getToggleByName('xxx')
      .then((result) => {
        expect(result).to.be.null;
      })
      .catch((err) => { throw err; });
  });
  it('test to load notification toggle without any name (null)', () => {
    util.getToggleByName()
      .then((result) => {
        expect(result).to.be.null;
      })
      .catch((err) => { throw err; });
  });
});

describe('test util.updateToggle', () => {
  it('update existing toggle', async () => {
    const toggleName = getToggleTestName();
    notification = 'DELETE_ME';

    util.createToggle(toggleName, false, notification)
      .then((newToggle) => {
        expect(newToggle.toggle).to.equal(false);
        return newToggle._id;
      })
      .then(id => util.updateToggle(id, true, `${notification}_TOO`))
      .then(toggle => util.getToggle(toggle._id))
      .then((result) => {
        expect(result).not.to.be.null;
        expect(result.toggle).to.equal(true);
        expect(result.notification).to.equal(`${notification}_TOO`);
      })
      .catch((err) => { throw err; });
  });
  it('update existing toggle but only notification text', () => {
    const toggleName = getToggleTestName();
    notification = 'DELETE_ME';

    util.createToggle(toggleName, false, notification)
      .then((newToggle) => {
        expect(newToggle.toggle).to.equal(false);
        return newToggle._id;
      })
      .then(id => util.updateToggle(id, undefined, `${notification}_TOO`))
      .then(toggle => util.getToggle(toggle._id))
      .then((result) => {
        expect(result).not.to.be.null;
        expect(result.notification).to.equal(`${notification}_TOO`);
      })
      .catch((err) => { throw err; });
  });

  it('update not existing toggle', () => {
    util.updateToggle('41224d776a326fb40f000001', true)
      .then((toggle) => {
        expect(toggle).to.be.null;
      })
      .catch((err) => { throw err; });
  });
});


describe('test util.deleteToggle', () => {
  const toggleName = getToggleTestName();
  it('delete an existing toggle', () => {
    util.createToggle(toggleName, 'true')
      .then(newToggle => newToggle._id)
      .then(id => util.deleteToggle(id))
      .then(toggle => util.getToggle(toggle._id))
      .then((result) => {
        expect(result).to.be.null;
      })
      .catch((err) => { throw err; });
  });

  it('try to delete a not existing toggle', () => {
    util.deleteToggle('41224d776a326fb40f000001')
      .then((result) => {
        expect(result).to.be.null;
      })
      .catch((err) => { throw err; });
  });


  after(() => {
    util.deleteTestToggles()
      .then((result) => {
        console.log(JSON.stringify(result));
      })
      .catch(err => console.log(err));
  });
});

function getToggleTestName() {
  return `TEST-TOGGLE-${Math.round(Math.random() * 100000000)}`;
}
