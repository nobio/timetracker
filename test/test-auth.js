require('dotenv').config();
require('../db');
const mongoose = require('mongoose');

const User = mongoose.model('User');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { mockRequest, mockResponse, } = require('mock-req-res')
const sinon = require('sinon');
var sinonChai = require('sinon-chai');

chai.use(chaiAsPromised);
chai.use(sinonChai);

const expect = chai.expect;
const assert = chai.assert;
const should = chai.should;

const util = require('../api/auth/util-auth');
const auth = require('../api/auth');

const TESTUSER_NAME = 'TEST_USER_DELETE_ME';
const TESTUSER_PASSWORD = 'Test12345';

describe('test utilAuth.getAllUsers', () => {
  let db;
  before(() => {
    db = require('../db');
  });

  it('getAllUsers', async () => {
    const result = await util.getAllUsers();
    // console.log(result);
    expect(result).to.be.an('array');
    expect(result).to.have.length > 0;
    expect(result[0]).to.have.property('name');
    expect(result[0]).to.have.property('password');
  });
});

describe('test utilAuth.createUser', () => {
  let db;
  before(async () => {
    await User.deleteOne({ name: TESTUSER_NAME });
    db = require('../db');
  });

  it('create new user', async () => {
    try {
      const result = await util.createUser(TESTUSER_NAME, TESTUSER_PASSWORD);
      expect(result).to.be.a('string');
      expect(result).to.equal('User created');
    } catch (err) {
      throw Error(err);
    }
  });

  it('try to create user twice', async () => {
    try {
      const result = await util.createUser(TESTUSER_NAME, TESTUSER_PASSWORD);
      assert.fail(); // should not reach this...
    } catch (err) {
      expect(err).to.be.an('error');
      expect(err.message).to.equal('User already exists');
    }
  });

  it('try to create user without password (empty)', async () => {
    try {
      await User.deleteOne({ name: TESTUSER_NAME });
      const result = await util.createUser(TESTUSER_NAME, '');
      assert.fail(); // should not reach this...
    } catch (err) {
      expect(err).to.be.an('error');
      expect(err.message).to.equal('No password provided');
    }
  });
  it('try to create user without password (undefined)', async () => {
    try {
      await User.deleteOne({ name: TESTUSER_NAME });
      const result = await util.createUser(TESTUSER_NAME);
      assert.fail(); // should not reach this...
    } catch (err) {
      expect(err).to.be.an('error');
      expect(err.message).to.equal('No password provided');
    }
  });
  it('try to create user without password (null)', async () => {
    try {
      await User.deleteOne({ name: TESTUSER_NAME });
      const result = await util.createUser(TESTUSER_NAME, null);
      assert.fail(); // should not reach this...
    } catch (err) {
      expect(err).to.be.an('error');
      expect(err.message).to.equal('No password provided');
    }
  });

  it('try to create user without name (empty)', async () => {
    try {
      await User.deleteOne({ name: TESTUSER_NAME });
      const result = await util.createUser('', '');
      assert.fail(); // should not reach this...
    } catch (err) {
      expect(err).to.be.an('error');
      expect(err.message).to.equal('User must be provided');
    }
  });
  it('try to create user without name (undefined)', async () => {
    try {
      await User.deleteOne({ name: TESTUSER_NAME });
      const result = await util.createUser();
      assert.fail(); // should not reach this...
    } catch (err) {
      expect(err).to.be.an('error');
      expect(err.message).to.equal('User must be provided');
    }
  });
  it('try to create user without name (null)', async () => {
    try {
      await User.deleteOne({ name: TESTUSER_NAME });
      const result = await util.createUser(null, null);
      assert.fail(); // should not reach this...
    } catch (err) {
      expect(err).to.be.an('error');
      expect(err.message).to.equal('User must be provided');
    }
  });
});

describe('test utilAuth.login', () => {
  let db;
  before(() => {
    db = require('../db');
  });

  it('login with valid principal and credenital', async () => {
    try {
      await util.createUser(TESTUSER_NAME, TESTUSER_PASSWORD);
      await new Promise(resolve => setTimeout(resolve, 100)); // sleep a little while...

      const result = await util.login(TESTUSER_NAME, TESTUSER_PASSWORD);

      expect(result).to.be.a('object');
      expect(result).to.have.property('accessToken');
    } catch (err) {
      throw Error(err);
    } finally {
      await new Promise(resolve => setTimeout(resolve, 100)); // sleep a little while...
      await User.deleteOne({ name: TESTUSER_NAME });
    }
  });

  it('login with valid principal and invalid credenital', async () => {
    try {
      await util.createUser(TESTUSER_NAME, 'XXXXX');
      await new Promise(resolve => setTimeout(resolve, 100)); // sleep a little while...

      const result = await util.login(TESTUSER_NAME, TESTUSER_PASSWORD);

      assert.fail(); // should not reach this...
    } catch (err) {
      expect(err).to.be.an('error');
      expect(err.message).to.equal('User not authenticated');
    } finally {
      await new Promise(resolve => setTimeout(resolve, 100)); // sleep a little while...
      await User.deleteOne({ name: TESTUSER_NAME });
    }
  });
  it('login with invalid principal and invalid credenital', async () => {
    try {
      const result = await util.login('YYYYYYYYYYYYYYYYYYYY', 'XXXXX');
      assert.fail(); // should not reach this...
    } catch (err) {
      expect(err).to.be.an('error');
      expect(err.message).to.equal('User not authenticated');
    }
  });

  after(async () => {
    await User.deleteOne({ name: TESTUSER_NAME });
    // db.closeConnection();
  });
});

describe('test index.authorizeToken', () => {
  it('test for OK (200): call authorizeToken service with empty header and auth switch off', async () => {
    process.env.AUTHORIZATION = 'off';
    const req = mockRequest({ headers: [] });
    const res = mockResponse();
    const next = sinon.spy();
    try {
      await auth.authorizeToken(req, res, next)
      expect(res.status).to.have.been.calledWith(200)
      expect(next).to.have.been.called
    } catch (err) {
      throw Error(err);
    }
  });

  it('test for Unauthorized (401): call authorizeToken service with empty header and auth switch on', async () => {
    //    const req = mockRequest({ headers: [{name: TESTUSER_NAME, password: TESTUSER_PASSWORD}] });
    process.env.AUTHORIZATION = 'on';
    const req = mockRequest({ headers: [] });
    const res = mockResponse();
    const next = sinon.spy();
    try {
      await auth.authorizeToken(req, res, next)
      expect(res.status).to.have.been.calledWith(401)
      expect(next).to.not.have.been.called
    } catch (err) {
      throw Error(err);
    }
  });

  it('test for Forbidden (403): call authorizeToken service with header but invalid token and auth switch on', async () => {
    //    const req = mockRequest({ headers: [{name: TESTUSER_NAME, password: TESTUSER_PASSWORD}] });
    process.env.AUTHORIZATION = 'on';
    const req = mockRequest({ headers: { authorization: 'Bearer xxx.yyy.zzz' } });
    const res = mockResponse();
    const next = sinon.spy();
    try {
      await auth.authorizeToken(req, res, next)

      expect(res.status).to.have.been.calledWith(403)
      expect(next).to.not.have.been.called
    } catch (err) {
      throw Error(err);
    }
  });

  it('test for OK (200): call authorizeToken service with header incl. valid token and auth switch on', async () => {
    process.env.AUTHORIZATION = 'on';
    const req = mockRequest({ headers: { authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiVGVzdGVyIiwiaWF0IjoxNTc4NzY0NzMwfQ.wvgbdBOxJBHc8PM1IH8bWXAv2YSgh-CPC9M9KQowJ4M' } });
    const res = mockResponse();
    const next = sinon.spy();
    try {
      await auth.authorizeToken(req, res, next)

      expect(res.status).to.have.been.calledWith(200)
      expect(req.user).to.have.property('name');   // name: <Username> was added to request
      expect(next).to.have.been.called
    } catch (err) {
      throw Error(err);
    }
  });
});
