/* eslint-disable prefer-destructuring */
require('./init');
require('../db');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { mockRequest, mockResponse } = require('mock-req-res');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(chaiAsPromised);
chai.use(sinonChai);
chai.use(require('chai-integer'));

const expect = chai.expect;
const assert = chai.assert;

const auth = require('../api/auth');
const misc = require('../api/misc');

/**
 * =============================================================
 * authorize
 * =============================================================
 */
describe('test misc functions', () => {
  it('test version', async () => {
    const req = mockRequest({ headers: [], body: {} });
    const res = mockResponse();
    const next = sinon.spy();
    let response;

    try {
      await misc.version(req, res, next);
      response = res.json.getCalls()[0].lastArg;
      // console.log(res.json.getCalls()[0].lastArg)
    } catch (err) {
      // console.log(err)
      assert.fail(`should not throw exception\n${err.message}`);
    }

    expect(res.status).to.have.been.calledWith(200);
    expect(response).to.have.property('version');
    expect(response).to.have.property('last_build');
  });

  it('test healthcheck', async () => {
    const req = mockRequest({ headers: [], body: {} });
    const res = mockResponse();
    const next = sinon.spy();
    let response;

    try {
      await misc.healthcheck(req, res, next);
      response = res.json.getCalls()[0].lastArg;
      // console.log(res.json.getCalls()[0].lastArg)
    } catch (err) {
      // console.log(err)
      assert.fail(`should not throw exception\n${err.message}`);
    }

    expect(res.status).to.have.been.calledWith(200);
    expect(response).to.have.property('version');
    expect(response).to.have.property('status');
    expect(response).to.have.property('time');
    expect(response).to.have.property('details');

    expect(response.details).to.be.an('array');
    expect(response.details).to.be.have.lengthOf(2);

    expect(response.details[0]).to.have.property('name');
    expect(response.details[0].name).to.equal('slack available');
    expect(response.details[0]).to.have.property('componentType');
    expect(response.details[0].componentType).to.equal('system');
    expect(response.details[0]).to.have.property('metricUnit');
    expect(response.details[0].metricUnit).to.equal('boolean');
    expect(response.details[0]).to.have.property('metricValue');
    expect(response.details[0].metricValue).to.equal(true);

    expect(response.details[1]).to.have.property('name');
    expect(response.details[1].name).to.equal('MongoDB');
    expect(response.details[1]).to.have.property('componentType');
    expect(response.details[1].componentType).to.equal('database');
    expect(response.details[1]).to.have.property('metricUnit');
    expect(response.details[1].metricUnit).to.equal('boolean');
    expect(response.details[1]).to.have.property('metricValue');
    expect(response.details[1].metricValue).to.equal(true);
  });
});
