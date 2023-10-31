/* eslint-disable prefer-destructuring */
require('./init');
require('../db');

const Chai = require('chai');
const Mocha = require('mocha');

const { expect, assert } = Chai;
const { describe, it } = Mocha;
const chaiAsPromised = require('chai-as-promised');
const { mockRequest, mockResponse } = require('mock-req-res');
const sinonChai = require('sinon-chai');

Chai.use(chaiAsPromised);
Chai.use(sinonChai);
Chai.use(require('chai-integer'));

const misc = require('../api/misc');

/**
 * =============================================================
 * authorize
 * =============================================================
 */
describe('test misc functions', () => {
  it('test ping with header x-forwareded-for', async () => {
    const req = mockRequest({ headers: { 'x-forwarded-for': '1.2.3.4' }, body: {} });
    const res = mockResponse();

    await misc.ping(req, res);
    const response = res.json.getCalls()[0].lastArg;

    expect(res.status).to.have.been.calledWith(200);
    expect(response).to.have.property('response');
    expect(response.response).to.equal('pong');
    expect(response).to.have.property('client_ip');
    expect(response.client_ip).to.equal('1.2.3.4');
  });
  it('test ping with header x-real-ip', async () => {
    const req = mockRequest({ headers: { 'x-real-ip': '1.2.3.4' }, body: {} });
    const res = mockResponse();

    await misc.ping(req, res);
    const response = res.json.getCalls()[0].lastArg;

    expect(res.status).to.have.been.calledWith(200);
    expect(response).to.have.property('response');
    expect(response.response).to.equal('pong');
    expect(response).to.have.property('client_ip');
    expect(response.client_ip).to.equal('1.2.3.4');
  });

  it('test version', async () => {
    const req = mockRequest({ headers: [], body: {} });
    const res = mockResponse();
    let response;

    try {
      await misc.version(req, res);
      response = res.json.getCalls()[0].lastArg;
    } catch (err) {
      assert.fail(`should not throw exception\n${err.message}`);
    }

    expect(res.status).to.have.been.calledWith(200);
    expect(response).to.have.property('version');
    expect(response).to.have.property('last_build');
  });

  it('test healthcheck', async () => {
    const req = mockRequest({ headers: [], body: {} });
    const res = mockResponse();
    let response;

    try {
      await misc.healthcheck(req, res);
      response = res.json.getCalls()[0].lastArg;
    } catch (err) {
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
