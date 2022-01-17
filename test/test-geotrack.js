require('dotenv').config(); process.env.SLACK_URL = '';
require('../db');
const mongoose = require('mongoose');
const moment = require('moment');

const GeoTracking = mongoose.model('GeoTracking');

const geo = require('../api/geotrack');
const util = require('../api/geotrack/util-geotrack');

const chai = require('chai');
chai.use(require('chai-datetime'));
const chaiAsPromised = require('chai-as-promised');
const { mockRequest, mockResponse } = require('mock-req-res');
const sinon = require('sinon');
const { stub, match } = require('sinon')
const sinonChai = require('sinon-chai');

chai.use(chaiAsPromised);
chai.use(sinonChai);

const expect = chai.expect;
const assert = chai.assert;
const should = chai.should;

/**
 * =============================================================
 * Distance 
 * =============================================================
 */
describe('test distance calculation', () => {

  it('distance near by', async () => {

    let dist = util.distance([{
      latitude: 49.5141556930523,
      longitude: 10.875497217473503
    }, {
      latitude: 49.514286993311146,
      longitude: 10.87513135572651
    }, {
      latitude: 49.51389,
      longitude: 10.87485
    }]);
    expect(dist).to.equal(79);

  });

  it('distance to Livinstone', async () => {

    dist = util.distance([{
      latitude: 49.5141556930523,
      longitude: 10.875497217473503
    }, {
      latitude: -17.84870850232013,
      longitude: 25.855451736188684
    }]);
    expect(dist).to.equal(7634714);

  });

  it('distance north to south pole', async () => {

    dist = util.distance([{
      latitude: 90,
      longitude: 0
    }, {
      latitude: -90,
      longitude: 0
    }]);
    expect(dist).to.equal(20015087);

  });

  it('distance with empty track', async () => {

    dist = util.distance([]);
    expect(dist).to.equal(0);

  });

  it('distance with one entry track', async () => {

    dist = util.distance([{
      latitude: 90,
      longitude: 0
    }]);
    expect(dist).to.equal(0);

  });
});

/**
 * =============================================================
 * Accuracy 
 * =============================================================
 */
describe('test accuracy calculation', () => {

  it('perfect accuracy', async () => {

    let acc = util.meanAccuracy([{
      accuracy: 0,
    }, {
      accuracy: 0,
    }, {
      accuracy: 0,
    }]);
    expect(acc.mean).to.equal(0);
    expect(acc.stdt).to.equal(0);

  });

  it('medium accuracy', async () => {

    let acc = util.meanAccuracy([{
      accuracy: 10,
    }, {
      accuracy: 20,
    }, {
      accuracy: 30,
    }]);
    expect(acc.mean).to.equal(20);
    expect(acc.stdt).to.equal(8.16496580927726);

  });

  it('accuracy with 0 entries', async () => {

    let acc = util.meanAccuracy([]);
    expect(acc.mean).to.be.NaN;
    expect(acc.stdt).to.equal(0);

  });

  it('accuracy with 1 entry', async () => {

    let acc = util.meanAccuracy([{
      accuracy: 10,
    }]);
    expect(acc.mean).to.equal(10);
    expect(acc.stdt).to.equal(0);

  });

  it('accuracy with many many random accuracy entries', async () => {
    const track = [];
    for (let n = 0; n < 100000; n++) {
      track.push({
        accuracy: Math.random() * 50
      })
    }
    let acc = util.meanAccuracy(track);
    // mean value should by around 25
    expect(acc.mean).to.be.approximately(25, 1)

    // stdt value should by around 14 (+/- 1)
    expect(acc.stdt).to.be.approximately(14, 1)

  });

});

/**
 * =============================================================
 * Parse Geo Tracking objects
 * =============================================================
 */
describe('test parsing of GeoTrack objects', () => {

  it('parse invalid GeoTrack object', async () => {
    const req = mockRequest({ headers: [], body: {} });
    const geoObj = util.parseGeoTrackingObject(req);
    expect(geoObj).to.be.undefined;
  });

  it('parse owntrack GeoTrack object', async () => {
    const body = {
      lon: 10.875663,
      acc: 32,
      vel: 0,
      lat: 49.514447,
      tst: 1632584826,
      alt: 309,
      vel: 1,
      tid: 'OWNTRACK',
    };

    const geoObj = util.parseGeoTrackingObject(body);

    expect(geoObj).to.not.be.undefined;
    expect(geoObj).to.have.property('_id');

    expect(geoObj).to.have.property('longitude');
    expect(geoObj.longitude).to.equal(10.875663);

    expect(geoObj).to.have.property('latitude');
    expect(geoObj.latitude).to.equal(49.514447);

    expect(geoObj).to.have.property('accuracy');
    expect(geoObj.accuracy).to.equal(32);

    expect(geoObj).to.have.property('altitude');
    expect(geoObj.altitude).to.equal('309');

    expect(geoObj).to.have.property('date');
    expect(moment(geoObj.date).toISOString()).to.equal(moment.unix(1632584826).toISOString());

    expect(geoObj).to.have.property('source');
    expect(geoObj.source).to.equal('OWNTRACK');

  });

  it('parse HASSIO GeoTrack object', async () => {
    const body = {
      longitude: 10.875663,
      accuracy: 32,
      latitude: 49.514447,
      source: 'HASSIO',
    };

    const geoObj = util.parseGeoTrackingObject(body);

    expect(geoObj).to.not.be.undefined;
    expect(geoObj).to.have.property('_id');

    expect(geoObj).to.have.property('longitude');
    expect(geoObj.longitude).to.equal(10.875663);

    expect(geoObj).to.have.property('latitude');
    expect(geoObj.latitude).to.equal(49.514447);

    expect(geoObj).to.have.property('accuracy');
    expect(geoObj.accuracy).to.equal(32);

    expect(geoObj).to.have.property('source');
    expect(geoObj.source).to.equal('HASSIO');

  });

  it('parse encrypted GeoTrack object', async () => {
    const body = {
      _type: 'encrypted',
    };

    const geoObj = util.parseGeoTrackingObject(body);
    expect(geoObj).to.be.null;
  });

});

/**
 * =============================================================
 * Create Geo Track
 * =============================================================
 */
describe('test creating of GeoTrack', () => {

  it('create GeoTrack', async () => {
    const timestamp = 1630000000 + Math.round((Math.random() * 10000000));
    const res = mockResponse();
    const req = mockRequest({
      headers: [], body: {
        lon: 10.875663,
        acc: 32,
        vel: 0,
        lat: 49.514447,
        tst: timestamp,
        alt: 309,
        vel: 1,
        tid: 'OWNTRACK',
      }
    });

    try {
      await geo.createGeoTrack(req, res);
      expect(res.status).to.have.been.calledWith(200); //duplicate
    } catch (error) {
      throw error;
    }
  });

  it('create GeoTrack', async () => {
    const res = mockResponse();
    const req = mockRequest({
      headers: [], body: {
        lon: 10.875663,
        acc: 32,
        vel: 0,
        lat: 49.514447,
        tst: 1632584826,
        alt: 309,
        vel: 1,
        tid: 'OWNTRACK',
      }
    });

    try {
      await geo.createGeoTrack(req, res);
      await geo.createGeoTrack(req, res);
      expect(res.status).to.have.been.calledWith(202); //duplicate
    } catch (error) {
      throw error;
    }
  });

  it('create GeoTrack with empty geo track (error expected)', async () => {
    const res = mockResponse();
    const req = mockRequest({ headers: [], body: {} });

    try {
      await geo.createGeoTrack(req, res);
      expect(res.status).to.have.been.calledWith(400);
    } catch (error) {
      throw error;
    }
  });

  it('create GeoTrack with geo track = null (error expected)', async () => {
    const res = mockResponse();
    const req = mockRequest({ headers: [], body: null });

    try {
      await geo.createGeoTrack(req, res);
      expect(res.status).to.have.been.calledWith(202);
    } catch (error) {
      throw error;
    }
  });

  it('create GeoTrack with geo track = undefined (error expected)', async () => {
    const res = mockResponse();
    const req = mockRequest({ headers: [] });

    try {
      await geo.createGeoTrack(req, res);
      expect(res.status).to.have.been.calledWith(400); //duplicate
    } catch (error) {
      throw error;
    }
  });

});


/**
 * =============================================================
 * Load Geo Tracking
 * =============================================================
 */
describe('test get GeoTracks', () => {

  it('load geo tracks', async () => {
    const track = await util.getGeoTrackingDataByTime(moment('2021-09-01'), moment('2021-09-02'));
    const dist = util.distance(track);
    const acc = util.meanAccuracy(track);

    expect(track.length).to.equal(110);
    expect(dist).to.equal(43425);
    expect(acc.mean).to.be.approximately(343, 2);
    expect(acc.stdt).to.be.approximately(607, 1);
  });

  it('load geo tracks', async () => {
    const res = mockResponse();
    const req = mockRequest({ headers: [], body: {} });
    req.query = { dateStart: '2021-09-01', dateEnd: '2021-09-02' };

    try {
      await geo.getGeoTracking(req, res);
    } catch (error) {
      assert.fail("should not throw error");       
    }
  });

  it('load geo tracks metadata', async () => {
    const res = mockResponse();
    const req = mockRequest({ headers: [], body: {} });
    req.query = { dateStart: '2021-09-01', dateEnd: '2021-09-02' };

    try {
      await geo.getGeoTrackingMetadata(req, res);
    } catch (error) {
      assert.fail("should not throw error");       
    }
  });

});

