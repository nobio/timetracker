require('dotenv').config();
require('../db');
const mongoose = require('mongoose');

const User = mongoose.model('User');
const Token = mongoose.model('Token');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const { mockRequest, mockResponse } = require('mock-req-res');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');

chai.use(chaiAsPromised);
chai.use(sinonChai);
chai.use( require('chai-integer'));

const expect = chai.expect;
const assert = chai.assert;
const should = chai.should;

const util = require('../api/auth/util-auth');
const auth = require('../api/auth');

const TESTUSER_NAME = 'TEST_USER_DELETE_ME';
const TESTUSER_PASSWORD = 'Test12345';

/**
 * =============================================================
 * getAllUsers
 * =============================================================
 */
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

/**
 * =============================================================
 * createUser
 * =============================================================
 */
describe('test utilAuth.createUser', () => {
  let db;
  before(async () => {
    await User.deleteOne({ name: TESTUSER_NAME });
    db = require('../db');
  });

  it('create new user', async () => {
    try {
      const result = await util.createUser(TESTUSER_NAME, TESTUSER_PASSWORD);
      expect(result).to.be.an.integer;
    } catch (err) {
      throw Error(err);
    }
  });

  it('try to create user twice', async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // sleep a little while...
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

/**
 * =============================================================
 * deleteUser
 * =============================================================
 */
describe('test utilAuth.deleteUser', () => {
  let db;
  before(async () => {
    await User.deleteOne({ name: TESTUSER_NAME });
    db = require('../db');
  });

  it('delete an existing user', async () => {
    try {
      const resultCreate = await util.createUser(TESTUSER_NAME, TESTUSER_PASSWORD);
      expect(resultCreate).to.be.an.integer;

      const resultDelete = await util.deleteUser(resultCreate);
      expect(resultCreate).to.be.an.integer;

    } catch (err) {
      throw Error(err);
    }
  });
  it('delete a non-existing user', async () => {
    try {
      await util.deleteUser("1234567");
    } catch (err) {
      expect(err).to.be.a("string");
      expect(err).to.equal("cannot delete user 1234567");
    }
  });

});

/**
 * =============================================================
 * login
 * =============================================================
 */
describe('test utilAuth.login', () => {
  let db;
  before(async () => {
    db = require('../db');
    await User.deleteOne({ name: TESTUSER_NAME });
    // *** create a user with password
    await util.createUser(TESTUSER_NAME, TESTUSER_PASSWORD);
    await new Promise(resolve => setTimeout(resolve, 100)); // sleep a little while...
  });

  it('login with valid principal and credenital', async () => {
    let refreshToken = '';
    try {
      const result = await util.login(TESTUSER_NAME, TESTUSER_PASSWORD);

      expect(result).to.be.a('object');
      expect(result).to.have.property('accessToken');
      expect(result).to.have.property('refreshToken');
      refreshToken = result.refreshToken;
    } catch (err) {
      throw Error(err);
    } finally {
      await Token.deleteOne({ token: refreshToken });
    }
  });

  it('login with valid principal and invalid credenital', async () => {
    try {
      const result = await util.login(TESTUSER_NAME, 'XXXXXX');

      assert.fail(); // should not reach this...
    } catch (err) {
      expect(err).to.be.an('error');
      expect(err.status).to.equal(401);
      expect(err.message).to.equal('Unauthorized');
    }
  });

  it('login with invalid principal and invalid credenital', async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const result = await util.login('YYYYYYYYYYYYYYYYYYYY', 'XXXXX');
      assert.fail(); // should not reach this...
    } catch (err) {
      expect(err).to.be.an('error');
      expect(err.status).to.equal(401);
      expect(err.message).to.equal('User not authenticated');
    }
  });

  it('test expire time: set expiretime to 2s, login, use accessToken, wait, fail using access token, get new token, use new access token', async () => {
    process.env.AUTHORIZATION = 'on';
    process.env.ACCESS_TOKEN_EXPIRE = '1s'; // 1000ms

    let refreshToken;
    let accessToken;
    let req;
    let res;
    const next = sinon.spy();

    try {
      // *** login to get the access- and refresh token
      const result = await util.login(TESTUSER_NAME, TESTUSER_PASSWORD);
      expect(result).to.be.a('object');
      expect(result).to.have.property('accessToken');
      expect(result).to.have.property('refreshToken');
      accessToken = result.accessToken;
      refreshToken = result.refreshToken;

      // *** check authorization
      req = mockRequest({ headers: { authorization: `Bearer ${accessToken}` } });
      req.url = '/api/auth/login';

      res = mockResponse();

      await auth.authorizeToken(req, res, next);
      // console.log(res.status.getCalls()[0].lastArg);
      expect(res.status).to.have.been.calledWith(200);

      // *** let the access token expire
      await new Promise(resolve => setTimeout(resolve, 1000));

      // *** authorization should fail now
      req = mockRequest({ headers: { authorization: `Bearer ${accessToken}` } });
      req.url = '/api/auth/login';
      res = mockResponse();

      await auth.authorizeToken(req, res, next);
      expect(res.status).to.have.been.calledWith(403);

      // *** get a new token using the refresh token
      accessToken = await (await util.refreshToken(refreshToken)).accessToken;

      // *** authorization should be great again
      req = mockRequest({ headers: { authorization: `Bearer ${accessToken}` } });
      req.url = '/api/auth/login';
      res = mockResponse();

      await auth.authorizeToken(req, res, next);
      expect(res.status).to.have.been.calledWith(200);
    } catch (err) {
      throw Error(err);
    } finally {
      await new Promise(resolve => setTimeout(resolve, 100)); // sleep a little while...
      await User.deleteOne({ name: TESTUSER_NAME });
      await Token.deleteOne({ token: refreshToken });
    }
  });

  after(async () => {
    await User.deleteOne({ name: TESTUSER_NAME });
  });
});

/**
 * =============================================================
 * authorizeToken
 * =============================================================
 */
describe('test index.authorizeToken', () => {
  it('test for OK (200): call authorizeToken service with empty header and auth switch off', async () => {
    process.env.AUTHORIZATION = 'off';
    const req = mockRequest({ headers: [] });
    const res = mockResponse();
    const next = sinon.spy();
    try {
      await auth.authorizeToken(req, res, next);
      expect(res.status).to.have.been.calledWith(200);
      expect(next).to.have.been.called;
    } catch (err) {
      throw Error(err);
    }
  });

  it('test for Unauthorized (401): call authorizeToken service with empty header and auth switch on', async () => {
    //    const req = mockRequest({ headers: [{name: TESTUSER_NAME, password: TESTUSER_PASSWORD}] });
    process.env.AUTHORIZATION = 'on';
    const req = mockRequest({ headers: [] }); req.url = '/api/xyz';
    const res = mockResponse();
    const next = sinon.spy();
    try {
      await auth.authorizeToken(req, res, next);
      expect(res.status).to.have.been.calledWith(401);
      expect(next).to.not.have.been.called;
    } catch (err) {
      throw Error(err);
    }
  });

  it('test for Forbidden (403): call authorizeToken service with header but invalid token and auth switch on', async () => {
    //    const req = mockRequest({ headers: [{name: TESTUSER_NAME, password: TESTUSER_PASSWORD}] });
    process.env.AUTHORIZATION = 'on';
    const req = mockRequest({ headers: { authorization: 'Bearer xxx.yyy.zzz' } }); req.url = '/api/xyz';
    const res = mockResponse();
    const next = sinon.spy();
    try {
      await auth.authorizeToken(req, res, next);

      expect(res.status).to.have.been.calledWith(403);
      expect(next).to.not.have.been.called;
    } catch (err) {
      throw Error(err);
    }
  });

  it('test for OK (200): call authorizeToken service with header incl. valid token and auth switch on', async () => {
    process.env.AUTHORIZATION = 'on';
    const req = mockRequest({ headers: { authorization: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJuYW1lIjoiVGVzdGVyIiwiaWF0IjoxNTc4NzY0NzMwfQ.wvgbdBOxJBHc8PM1IH8bWXAv2YSgh-CPC9M9KQowJ4M' } });
    req.url = '/api/xyz';
    const res = mockResponse();
    const next = sinon.spy();
    try {
      await auth.authorizeToken(req, res, next);

      expect(res.status).to.have.been.calledWith(200);
      expect(req.user).to.have.property('name'); // name: <Username> was added to request
      expect(next).to.have.been.called;
    } catch (err) {
      throw Error(err);
    }
  });
});

/**
 * =============================================================
 * refreshToken
 * =============================================================
 */
describe('test index.refreshToken', () => {
  let accessToken;
  let refreshToken;

  before(async () => {
    // *** create a user with password
    await util.createUser(TESTUSER_NAME, TESTUSER_PASSWORD);
    await new Promise(resolve => setTimeout(resolve, 100)); // sleep a little while...

    // *** then login to get the access- and refresh token
    const result = await util.login(TESTUSER_NAME, TESTUSER_PASSWORD);
    expect(result).to.be.a('object');
    expect(result).to.have.property('accessToken');
    expect(result).to.have.property('refreshToken');
    accessToken = result.accessToken;
    refreshToken = result.refreshToken;
  });

  it('test for OK (200): call refreshToken', async () => {
    const req = mockRequest({ headers: [], params: { token: refreshToken } });
    const res = mockResponse();
    const next = sinon.spy();

    try {
      await auth.refreshToken(req, res, next);
      expect(res.status).to.have.been.calledWith(200);
    } catch (err) {
      throw Error(err);
    }
  });

  it('test for NOK (401): call refreshToken but without token', async () => {
    const req = mockRequest({ headers: [], body: { token: null } });
    const res = mockResponse();
    const next = sinon.spy();

    try {
      await auth.refreshToken(req, res, next);
      expect(res.status).to.have.been.calledWith(401);
    } catch (err) {
      throw Error(err);
    }
  });

  it('test for NOK (401): call refreshToken with invalid token', async () => {
    const req = mockRequest({ headers: [], body: { token: 'xxx.yyy.zzz' } });
    const res = mockResponse();
    const next = sinon.spy();

    try {
      await auth.refreshToken(req, res, next);
      // console.log(res.json.getCalls()[0].lastArg)
      expect(res.status).to.have.been.calledWith(401);
    } catch (err) {
      throw Error(err);
    }
  });

  after(async () => {
    await User.deleteOne({ name: TESTUSER_NAME });
    await Token.deleteOne({ token: refreshToken });
    await Token.deleteMany({ user: TESTUSER_NAME });
  });
});

/**
 * =============================================================
 * logout
 * =============================================================
 */
describe('test index.logout', () => {
  before(async () => {
    // *** create a user with password
    await util.createUser(TESTUSER_NAME, TESTUSER_PASSWORD);
    await new Promise(resolve => setTimeout(resolve, 100)); // sleep a little while...
  });

  it('test for OK (200): call logout', async () => {
    // *** login to get the access- and refresh token
    const result = await util.login(TESTUSER_NAME, TESTUSER_PASSWORD);
    const token = result.refreshToken;

    let req = mockRequest({ headers: [], params: { token } }); 
    let res = mockResponse();
    const next = sinon.spy();

    try {
      await auth.logout(req, res, next);
      expect(res.status).to.have.been.calledWith(200);

      // *** authorization should fail now
      process.env.AUTHORIZATION = 'on';
      req = mockRequest({ headers: { authorization: `Bearer ${token}` } }); req.url = '/api/xyz';
      res = mockResponse();

      await auth.authorizeToken(req, res, next);
      expect(res.status).to.have.been.calledWith(403); // Forbidden
      expect(next).to.not.have.been.called;
    } catch (err) {
      throw Error(err);
    }
  });

  it('test for OK (200): call logout but without token', async () => {
    const req = mockRequest({ headers: [], params: { token: null } });
    const res = mockResponse();
    const next = sinon.spy();

    try {
      await auth.logout(req, res, next);
      expect(res.status).to.have.been.calledWith(400);
    } catch (err) {
      throw Error(err);
    }
  });

  it('test for NOK (200): call logout with invalid token', async () => {
    const req = mockRequest({ headers: [], params: { token: 'xxx.yyy.zzz' } });
    const res = mockResponse();
    const next = sinon.spy();

    try {
      await auth.logout(req, res, next);
      // console.log(res.json.getCalls()[0].lastArg)
      expect(res.status).to.have.been.calledWith(200);
    } catch (err) {
      throw Error(err);
    }
  });

  after(async () => {
    await User.deleteOne({ name: TESTUSER_NAME });
    await Token.deleteMany({ user: TESTUSER_NAME });
  });
});

