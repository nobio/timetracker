require('../db');
const mongoose = require('mongoose');

const GeoTracking = mongoose.model('GeoTracking');

const geo = require('../api/geotrack');

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
 * getAllUsers
 * =============================================================
 */
describe('test index', () => {
  before(() => {
    process.env.AUTHORIZATION = 'off';
  });

//  it('createGeoTrack', async () => {
//  });
});

