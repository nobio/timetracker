require('../db');
const mongoose = require('mongoose');
const moment = require('moment');

const GeoTracking = mongoose.model('GeoTracking');

const geo = require('../api/geotrack');
const util = require('../api/geotrack/util-geotrack');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { mockRequest, mockResponse } = require('mock-req-res');
const sinon = require('sinon');
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
    for(let n=0; n<100000; n++) {
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
 * Load Gro Tracking
 * =============================================================
 */
 describe('test Geo Tracks', () => {

  it('load geo tracks', async () => {

    const track = await util.getGeoTrackingDataByTime(moment('2021-09-01'), moment('2021-09-02'));
    const dist = util.distance(track);
    const acc = util.meanAccuracy(track);

    expect(track.length).to.equal(110);
    expect(dist).to.equal(43425);
    expect(acc.mean).to.be.approximately(343, 2);
    expect(acc.stdt).to.be.approximately(607, 1);


  });
});

