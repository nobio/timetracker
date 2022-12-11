require('./init');
const moment = require('moment');
const { assert } = require('chai');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
const { expect } = chai;
const util = require('../api/admin/util-geofences');

let GEOFENCE;

describe('test read geofences', () => {
  it('read all geofences', async () => {
    const gf = await util.getGeofences();

    expect(gf).to.be.a('array');
    expect(gf.length).to.be.greaterThan(0);
    expect(gf[0]).to.be.a('object');

    expect(gf[0]).to.have.property('id');
    expect(gf[0]).to.have.property('enabled');
    expect(gf[0]).to.have.property('longitude');
    expect(gf[0]).to.have.property('latitude');
    expect(gf[0]).to.have.property('radius');
    expect(gf[0]).to.have.property('description');
    expect(gf[0]).to.have.property('isCheckedIn');
    expect(gf[0]).to.have.property('lastChange');
  });
});
describe('test read one perticular geofence', () => {
  before(async () => {
    GEOFENCE = await util.createGeofence(true, 10, 20, 30, 'test', false);
    // console.log(GEOFENCE);
  });

  it('read an existing geofecne', async () => {
    const gf = await util.getGeofence(GEOFENCE.id);
    expect(gf).to.be.a('object');
    expect(gf).to.have.property('id');
    expect(gf).to.have.property('enabled');
    expect(gf).to.have.property('longitude');
    expect(gf.longitude).to.equal(10);
    expect(gf).to.have.property('latitude');
    expect(gf.latitude).to.equal(20);
    expect(gf).to.have.property('radius');
    expect(gf.radius).to.equal(30);
    expect(gf).to.have.property('description');
    expect(gf.description).to.equal('test');
    expect(gf).to.have.property('isCheckedIn');
    expect(gf.isCheckedIn).to.equal(false);
    expect(gf).to.have.property('lastChange');
  });

  it('try to read a not existing geofence', async () => {
    try {
      await util.getGeofence('NOTEXISITINGKEY');
    } catch (err) {
      expect(err).to.be.an('error');
      expect(err.message).to.equal('geofence with id NOTEXISITINGKEY could not be found');
    }
  });

  it('try to read geofence with an undefined id', async () => {
    try {
      await util.getGeofence();
    } catch (err) {
      expect(err).to.be.an('error');
      expect(err.message).to.equal('the id must not be undefined');
    }
  });

  it('try to read geofence with an null key', async () => {
    try {
      await util.getGeofence(null);
    } catch (err) {
      expect(err).to.be.an('error');
      expect(err.message).to.equal('the id must not be undefined');
    }
  });

  after(async () => {
    // delete the test geofence again
    await util.deleteGeofence(GEOFENCE.id);
  });
});

describe('test set a geofence', () => {
  before(async () => {
    // delete the test geofence again
    try { await util.deleteGeofence(GEOFENCE.id); } catch (error) { }
    GEOFENCE = await util.createGeofence(true, 10, 20, 30, 'test', false);
  });

  it('set an existing geofence', async () => {
    // console.log(GEOFENCE);
    const gf = await util.setGeofence(GEOFENCE.id, false, -10, -20, 100, 'new test', true, moment().toISOString());
    expect(gf).to.be.a('object');
    expect(gf).to.have.property('id');
    expect(gf).to.have.property('enabled');
    expect(gf).to.have.property('longitude');
    expect(gf.longitude).to.equal(-10);
    expect(gf).to.have.property('latitude');
    expect(gf.latitude).to.equal(-20);
    expect(gf).to.have.property('radius');
    expect(gf.radius).to.equal(100);
    expect(gf).to.have.property('description');
    expect(gf.description).to.equal('new test');
    expect(gf).to.have.property('isCheckedIn');
    expect(gf.isCheckedIn).to.equal(true);
    expect(gf).to.have.property('lastChange');
  });

  it('update an exsisting geofence with undefined value', async () => {
    // update the geofence with a new vale
    try {
      await util.setGeofence();
    } catch (err) {
      console.log(err.message);
      expect(err).to.be.an('error');
      expect(err.message).to.equal('could not create new geofence: geo fence object could not be updated because it does not exist');
    }
  });

  it('update an exsisting geofence with null value', async () => {
    // update the geofence with a new vale
    try {
      await util.setGeofence(null);
    } catch (err) {
      expect(err).to.be.an('error');
      expect(err.message).to.equal('could not create new geofence: geo fence object could not be updated because it does not exist');
    }
  });

  after(async () => {
    // delete the test property again
    await util.deleteGeofence(GEOFENCE.id);
  });
});

describe('test create a geofence', () => {
  it('create a proper geofence', async () => {
    const gf = await util.createGeofence(true, 10, 20, 30, 'test', false);
    expect(gf).to.be.a('object');
    expect(gf).to.have.property('id');
    expect(gf).to.have.property('enabled');
    expect(gf).to.have.property('longitude');
    expect(gf.longitude).to.equal(10);
    expect(gf).to.have.property('latitude');
    expect(gf.latitude).to.equal(20);
    expect(gf).to.have.property('radius');
    expect(gf.radius).to.equal(30);
    expect(gf).to.have.property('description');
    expect(gf.description).to.equal('test');
    expect(gf).to.have.property('isCheckedIn');
    expect(gf.isCheckedIn).to.equal(false);
    expect(gf).to.have.property('lastChange');

    // clean up
    await util.deleteGeofence(gf.id);
  });

  it('create geofence with missing data', async () => {
    try {
      await util.createGeofence(10);
    } catch (err) {
      expect(err).to.be.an('error');
      expect(err.message).to.equal('could not create new geofence');
    }
  });
});

describe('test delete a geofence', () => {
  before(async () => {
    // delete the test geofence again
    try { await util.deleteGeofence(GEOFENCE.id); } catch (error) { }
  });

  it('set a new geofence and delete it', async () => {
    // create a new geofence
    GEOFENCE = await util.createGeofence(true, 10, 20, 30, 'test', false);

    // delete the geofence
    const gf = await util.deleteGeofence(GEOFENCE.id);
    expect(gf).to.be.undefined;
  });

  it('try to delete a not exisiting geofence', async () => {
    try {
      await util.deleteGeofence('636e46938983cbf1f26e522a');
    } catch (err) {
      expect(err).to.be.an('error');
      expect(err.message).to.equal('the key must not be undefined');
    }
  });

  it('try to delete a geofence with an undefined id', async () => {
    try {
      await util.deleteGeofence();
    } catch (err) {
      expect(err).to.be.an('error');
      expect(err.message).to.equal('the id must not be undefined');
    }
  });

  it('try to delete a geofence with an null id', async () => {
    try {
      await util.deleteGeofence(null);
    } catch (err) {
      expect(err).to.be.an('error');
      expect(err.message).to.equal('the id must not be undefined');
    }
  });

  after(async () => {
    // delete the test property again
    try { await util.deleteGeofence(GEOFENCE.id); } catch (error) { }
  });
});
