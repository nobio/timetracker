/* eslint-disable prefer-destructuring */
//require('dotenv').config(); - there is no .env after building with github actions
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
chai.use(require('chai-integer'));

const expect = chai.expect;
const assert = chai.assert;
const should = chai.should;

const util = require('../api/auth/util-auth');
const auth = require('../api/auth');

const TESTUSER_USERNAME = 'TEST_USER_USERNAME_DELETE_ME';
const TESTUSER_PASSWORD = 'Test12345';
const TESTUSER_NAME = 'TEST_USER_DELETE_ME';
const TESTUSER_MAIL = 'TEST_USER_DELETE_ME@fake.com';

process.env.AUTHORIZATION = 'on'

process.env.ACCESS_TOKEN_SECRET = 'TEST_ACCESS_TOKEN_SECRET'
process.env.REFRESH_TOKEN_SECRET = 'TEST_REFRESH_TOKEN_SECRET'

process.env.ACCESS_TOKEN_EXPIRE = '5m'
process.env.REFRESH_TOKEN_EXPIRE = '7d'

/**
 * =============================================================
 * getAllUsers
 * =============================================================
 */
describe('test utilAuth.getAllUsers', () => {
  let db;
  before(async () => {
    db = require('../db');
    await User.deleteOne({ username: TESTUSER_USERNAME });
    await util.createUser(TESTUSER_USERNAME, TESTUSER_PASSWORD, TESTUSER_NAME, TESTUSER_MAIL);
  });

  it('getAllUsers', async () => {
    const result = await util.getAllUsers();
    // console.log(result);
    expect(result).to.be.an('array');
    expect(result).to.have.length > 0;
    expect(result[0]).to.have.property('username');
    expect(result[0]).to.have.property('name');
    expect(result[0]).to.have.property('mailAddress');
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
    await User.deleteOne({ username: TESTUSER_USERNAME });
    db = require('../db');
  });

  it('create new user', async () => {
    try {
      const result = await util.createUser(TESTUSER_USERNAME, TESTUSER_PASSWORD, TESTUSER_NAME, TESTUSER_MAIL);
      expect(result).to.be.an.integer;
      const user = await util.getUser(result);
      expect(user.username).to.eq(TESTUSER_USERNAME);
      expect(user.name).to.eq(TESTUSER_NAME);
      expect(user.mailAddress).to.eq(TESTUSER_MAIL);
    } catch (err) {
      assert.fail('should not throw exception')
    }
  });

  it('try to create user twice', async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); // sleep a little while...
      const result = await util.createUser(TESTUSER_USERNAME, TESTUSER_PASSWORD, TESTUSER_NAME, TESTUSER_MAIL);
      assert.fail(); // should not reach this...
    } catch (err) {
      expect(err).to.be.an('error');
      expect(err.message).to.equal('User already exists');
    }
  });

  it('try to create user without password (empty)', async () => {
    try {
      await User.deleteOne({ name: TESTUSER_USERNAME });
      const result = await util.createUser(TESTUSER_USERNAME, '');
      assert.fail(); // should not reach this...
    } catch (err) {
      expect(err).to.be.an('error');
      expect(err.message).to.equal('No password provided');
    }
  });
  it('try to create user without password (null)', async () => {
    try {
      await User.deleteOne({ name: TESTUSER_USERNAME });
      const result = await util.createUser(TESTUSER_USERNAME, null);
      assert.fail(); // should not reach this...
    } catch (err) {
      expect(err).to.be.an('error');
      expect(err.message).to.equal('No password provided');
    }
  });
  it('try to create user without password (undefined)', async () => {
    try {
      await User.deleteOne({ name: TESTUSER_USERNAME });
      const result = await util.createUser(TESTUSER_USERNAME);
      assert.fail(); // should not reach this...
    } catch (err) {
      expect(err).to.be.an('error');
      expect(err.message).to.equal('No password provided');
    }
  });
  it('try to create user without mail address (undefined)', async () => {
    try {
      await User.deleteOne({ name: TESTUSER_USERNAME });
      const result = await util.createUser(TESTUSER_USERNAME, TESTUSER_PASSWORD, TESTUSER_NAME);
      assert.fail(); // should not reach this...
    } catch (err) {
      expect(err).to.be.an('error');
      expect(err.message).to.equal('Mail address must be provided');
    }
  });
  it('try to create user without display name (undefined)', async () => {
    try {
      await User.deleteOne({ name: TESTUSER_USERNAME });
      const result = await util.createUser(TESTUSER_USERNAME, TESTUSER_PASSWORD, undefined, TESTUSER_MAIL);
      assert.fail(); // should not reach this...
    } catch (err) {
      expect(err).to.be.an('error');
      expect(err.message).to.equal('Display name  must be provided');
    }
  });
  it('try to create user without display name (null)', async () => {
    try {
      await User.deleteOne({ name: TESTUSER_USERNAME });
      const result = await util.createUser(TESTUSER_USERNAME, TESTUSER_PASSWORD, null, TESTUSER_MAIL);
      assert.fail(); // should not reach this...
    } catch (err) {
      expect(err).to.be.an('error');
      expect(err.message).to.equal('Display name  must be provided');
    }
  });
  it('try to create user without name (empty)', async () => {
    try {
      await User.deleteOne({ password: TESTUSER_PASSWORD });
      const result = await util.createUser('', '');
      assert.fail(); // should not reach this...
    } catch (err) {
      expect(err).to.be.an('error');
      expect(err.message).to.equal('Users unique user name must be provided');
    }
  });
  it('try to create user without name (undefined)', async () => {
    try {
      await User.deleteOne({ username: undefined, password: TESTUSER_PASSWORD });
      const result = await util.createUser();
      assert.fail(); // should not reach this...
    } catch (err) {
      expect(err).to.be.an('error');
      expect(err.message).to.equal('Users unique user name must be provided');
    }
  });
  it('try to create user without name (null)', async () => {
    try {
      await User.deleteOne({ username: TESTUSER_USERNAME });
      const result = await util.createUser(null, null);
      assert.fail(); // should not reach this...
    } catch (err) {
      expect(err).to.be.an('error');
      expect(err.message).to.equal('Users unique user name must be provided');
    }
  });
});

/**
 * =============================================================
 * updateUser
 * =============================================================
 */
describe('test utilAuth.updateUser', () => {
  let db;
  let userId;
  before(async () => {
    db = require('../db');
  });

  after(async () => {
    await util.deleteUser(userId);
  });

  it('update an existing user', async () => {
    try {
      await User.deleteOne({ username: TESTUSER_USERNAME });
      await User.deleteOne({ username: 'dduck' });
      userId = await util.createUser(TESTUSER_USERNAME, TESTUSER_PASSWORD, TESTUSER_NAME, TESTUSER_MAIL);

      const id = await util.updateUser(userId, 'dduck', 'Donald Duck', 'donald.duck@aol.com');
      expect(id).to.be.an.integer;

      const user = await util.getUser(id);
      expect(user.username).to.be.equal('dduck');
      expect(user.name).to.be.equal('Donald Duck');
      expect(user.mailAddress).to.be.equal('donald.duck@aol.com');
    } catch (err) {
      assert.fail('should not throw exception')
    }
  });
  it('update an existing user - id null', async () => {
    try {
      await User.deleteOne({ username: TESTUSER_USERNAME });
      await User.deleteOne({ username: 'dduck' });
      userId = await util.createUser(TESTUSER_USERNAME, TESTUSER_PASSWORD, TESTUSER_NAME, TESTUSER_MAIL);

      const id = await util.updateUser(null, 'dduck', 'Donald Duck', 'donald.duck@aol.com');
      assert.fail('should throw an exception but does not');
    } catch (err) {
      expect(err).to.be.a('error');
    }
  });
  it('update an existing user - username null', async () => {
    try {
      await User.deleteOne({ username: TESTUSER_USERNAME });
      await User.deleteOne({ username: 'dduck' });
      userId = await util.createUser(TESTUSER_USERNAME, TESTUSER_PASSWORD, TESTUSER_NAME, TESTUSER_MAIL);

      const id = await util.updateUser(userId, null, 'Donald Duck', 'donald.duck@aol.com');
      const user = await util.getUser(id);

      expect(user.username).to.be.equal(TESTUSER_USERNAME); // remains unchanged
      expect(user.name).to.be.equal('Donald Duck');
      expect(user.mailAddress).to.be.equal('donald.duck@aol.com');
    } catch (err) {
      assert.fail('should not throw exception')
    }
  });
  it('update an existing user - name null', async () => {
    await User.deleteOne({ username: TESTUSER_USERNAME });
    await User.deleteOne({ username: 'dduck' });
    userId = await util.createUser(TESTUSER_USERNAME, TESTUSER_PASSWORD, TESTUSER_NAME, TESTUSER_MAIL);

    try {
      const id = await util.updateUser(userId, 'dduck', null, 'donald.duck@aol.com');
      const user = await util.getUser(id);

      expect(user.username).to.be.equal('dduck'); // remains unchanged
      expect(user.name).to.be.equal(TESTUSER_NAME);
      expect(user.mailAddress).to.be.equal('donald.duck@aol.com');
    } catch (err) {
      console.log(err)
      assert.fail('should not throw exception')
    }
  });
  it('update an existing user - mailadress null', async () => {
    await User.deleteOne({ username: TESTUSER_USERNAME });
    await User.deleteOne({ username: 'dduck' });
    userId = await util.createUser(TESTUSER_USERNAME, TESTUSER_PASSWORD, TESTUSER_NAME, TESTUSER_MAIL);

    try {
      const id = await util.updateUser(userId, 'dduck', 'Donald Duck', null);
      const user = await util.getUser(id);

      expect(user.username).to.be.equal('dduck'); // remains unchanged
      expect(user.name).to.be.equal('Donald Duck');
      expect(user.mailAddress).to.be.equal(TESTUSER_MAIL);
    } catch (err) {
      console.log(err)
      assert.fail('should not throw exception')
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
    await User.deleteOne({ username: TESTUSER_USERNAME });
    db = require('../db');
  });

  it('delete an existing user', async () => {
    try {
      const resultCreate = await util.createUser(TESTUSER_USERNAME, TESTUSER_PASSWORD, TESTUSER_NAME, TESTUSER_MAIL);
      expect(resultCreate).to.be.an.integer;

      const resultDelete = await util.deleteUser(resultCreate);
      expect(resultCreate).to.be.an.integer;
    } catch (err) {
      assert.fail('should not throw exception')
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
    await User.deleteOne({ username: TESTUSER_USERNAME });
    // *** create a user with password
    await util.createUser(TESTUSER_USERNAME, TESTUSER_PASSWORD, TESTUSER_NAME, TESTUSER_MAIL);
    await new Promise(resolve => setTimeout(resolve, 100)); // sleep a little while...
  });

  it('login with valid principal and credenital', async () => {
    let refreshToken = '';
    try {
      const result = await util.login(TESTUSER_USERNAME, TESTUSER_PASSWORD);

      expect(result).to.be.a('object');
      expect(result).to.have.property('accessToken');
      expect(result).to.have.property('refreshToken');

      refreshToken = result.refreshToken;
      expect(refreshToken).to.be.a('string');
    } catch (err) {
      assert.fail('should not throw exception')
    } finally {
      await Token.deleteOne({ token: refreshToken });
    }
  });

  it('login with valid principal and invalid credential', async () => {
    try {
      const result = await util.login(TESTUSER_USERNAME, 'XXXXXX');

      assert.fail(); // should not reach this...
    } catch (err) {
      expect(err).to.be.an('error');
      expect(err.status).to.equal(401);
      expect(err.message).to.equal('User not authenticated');
    }
  });

  it('login with not existing username', async () => {
    try {
      const result = await util.login(null, 'XXXXXX');

      assert.fail(); // should not reach this...
    } catch (err) {
      expect(err).to.be.an('error');
      expect(err.status).to.equal(400);
      expect(err.message).to.equal('User must be provided');
    }
  });
  it('login with not existing password', async () => {
    try {
      const result = await util.login(TESTUSER_USERNAME, null);

      assert.fail(); // should not reach this...
    } catch (err) {
      expect(err).to.be.an('error');
      expect(err.status).to.equal(400);
      expect(err.message).to.equal('No password provided');
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

  it('login and remove ExpireToken', async () => {
    let refreshToken = '';
    try {
      const result = await util.login(TESTUSER_USERNAME, TESTUSER_PASSWORD);

      expect(result).to.be.a('object');
      expect(result).to.have.property('accessToken');
      expect(result).to.have.property('refreshToken');

      refreshToken = result.refreshToken;
      expect(refreshToken).to.be.a('string');
      const expireToken = result.expireToken;
      expect(refreshToken).to.be.a('string');

      await util.removeExpiredToken();
      
    } catch (err) {
      assert.fail('should not throw exception')
    } finally {
      await Token.deleteOne({ token: refreshToken });
    }
  });

  it('test expire time: set expiretime to 2s, login, use accessToken, wait, fail using access token, get new token, use new access token', async () => {
    process.env.AUTHORIZATION = 'on';
    process.env.ACCESS_TOKEN_EXPIRE = '1s'; // 1000ms
    process.env.IGNORE_AUTH_PROTOCOL = 'http'

    let refreshToken;
    let accessToken;
    let req;
    let res;
    const next = sinon.spy();

    try {
      // *** login to get the access- and refresh token
      const result = await util.login(TESTUSER_USERNAME, TESTUSER_PASSWORD);
      expect(result).to.be.a('object');
      expect(result).to.have.property('accessToken');
      expect(result).to.have.property('refreshToken');
      accessToken = result.accessToken;
      refreshToken = result.refreshToken;

      // *** check authorization
      req = mockRequest({ headers: { authorization: `Bearer ${accessToken}` } });
      req.url = '/api/auth/login';

      res = mockResponse();

      await auth.authorize(req, res, next);
      // console.log(res.status.getCalls()[0].lastArg);
      expect(res.status).to.have.been.calledWith(200);

      // *** let the access token expire
      await new Promise(resolve => setTimeout(resolve, 1000));

      // *** authorization should fail now
      req = mockRequest({ headers: { authorization: `Bearer ${accessToken}` } });
      req.url = '/api/auth/login';
      res = mockResponse();

      await auth.authorize(req, res, next);
      expect(res.status).to.have.been.calledWith(401);

      // *** get a new token using the refresh token
      accessToken = await (await util.refreshToken(refreshToken)).accessToken;

      // *** authorization should be great again
      req = mockRequest({ headers: { authorization: `Bearer ${accessToken}` } });
      req.url = '/api/auth/login';
      res = mockResponse();

      await auth.authorize(req, res, next);
      expect(res.status).to.have.been.calledWith(200);
    } catch (err) {
      assert.fail('should not throw exception')
    } finally {
      await new Promise(resolve => setTimeout(resolve, 100)); // sleep a little while...
      await User.deleteOne({ name: TESTUSER_USERNAME });
      await Token.deleteOne({ token: refreshToken });
    }
  });

  it('remove Tester Tokens', async () => {
    try {
      await util.removeTesterToken();      
    } catch (err) {
      assert.fail('should not throw exception')
    }
  });

  after(async () => {
    await User.deleteOne({ name: TESTUSER_USERNAME });
  });
});

/**
 * =============================================================
 * set password
 * =============================================================
 */
describe('test utilAuth.updateUsersPassword', () => {
  let refreshToken;
  let userId;
  let db;
  before(async () => {
    db = require('../db');
    await User.deleteOne({ username: TESTUSER_USERNAME });
    // *** create a user with password
    userId = await util.createUser(TESTUSER_USERNAME, TESTUSER_PASSWORD, TESTUSER_NAME, TESTUSER_MAIL);
    await new Promise(resolve => setTimeout(resolve, 100)); // sleep a little while...
  });

  it('set new password for existing user', async () => {
    const NEW_PASSWORD = "___SECRETPSSWORD___";
    try {
      let result = await util.login(TESTUSER_USERNAME, TESTUSER_PASSWORD);
      expect(result).to.be.a('object');
      expect(result).to.have.property('accessToken');
      expect(result).to.have.property('refreshToken');

      // update password
      await util.updateUsersPassword(userId, NEW_PASSWORD);
      await new Promise(resolve => setTimeout(resolve, 100)); // sleep a little while...

      // try to login with new password
      result = await util.login(TESTUSER_USERNAME, NEW_PASSWORD);
      expect(result).to.be.a('object');
      expect(result).to.have.property('accessToken');
      expect(result).to.have.property('refreshToken');

      // try to login with old password
      try {
        result = await util.login(TESTUSER_USERNAME, TESTUSER_PASSWORD);
        assert.fail(); // should not reach this...
      } catch (err) {
        expect(err).to.be.an('error');
        expect(err.status).to.equal(401);
        expect(err.message).to.equal('User not authenticated');
      }

    } catch (err) {
      assert.fail('should not throw exception')
    } finally {
      await Token.deleteOne({ token: refreshToken });
    }
  });

  it('set new password for not existing user', async () => {
    const NEW_PASSWORD = "___SECRETPSSWORD___";
    try {
      // update password
      await util.updateUsersPassword('asdkahsd87ggakjhfbjkshdbuszvf', NEW_PASSWORD);
      assert.fail(); // should not reach 
    } catch (err) {
      expect(err).to.be.an('error');
      expect(err.message).to.equal('User does not exists');
    } finally {
      await Token.deleteOne({ token: refreshToken });
    }
  });

  it('set new password but do not provide user id', async () => {
    const NEW_PASSWORD = "___SECRETPSSWORD___";
    try {
      // update password
      await util.updateUsersPassword(null, NEW_PASSWORD);
      assert.fail(); // should not reach 
    } catch (err) {
      expect(err).to.be.an('error');
      expect(err.message).to.equal('User must be provided');
    } finally {
      await Token.deleteOne({ token: refreshToken });
    }
  });

  it('set new password but do not provide password', async () => {
    const NEW_PASSWORD = "___SECRETPSSWORD___";
    try {
      // update password
      await util.updateUsersPassword(userId, null);
      assert.fail(); // should not reach 
    } catch (err) {
      expect(err).to.be.an('error');
      expect(err.message).to.equal('Password must be provided');
    } finally {
      await Token.deleteOne({ token: refreshToken });
    }
  });

  after(async () => {
    await User.deleteOne({ name: TESTUSER_USERNAME });
  });
});


/**
 * =============================================================
 * authorize
 * =============================================================
 */
describe('test index.authorize', () => {
  before(async () => {
    db = require('../db');
    await User.deleteOne({ username: TESTUSER_USERNAME });
    // *** create a user with password
    await util.createUser(TESTUSER_USERNAME, TESTUSER_PASSWORD, TESTUSER_NAME, TESTUSER_MAIL);
    await new Promise(resolve => setTimeout(resolve, 100)); // sleep a little while...
  });

  it('test for OK (200): call authorizeToken service with empty header and auth switch off', async () => {
    process.env.AUTHORIZATION = 'off';
    const req = mockRequest({ headers: [] });
    const res = mockResponse();
    const next = sinon.spy();
    try {
      await auth.authorize(req, res, next);
      expect(res.status).to.have.been.calledWith(200);
      expect(next).to.have.been.called;
    } catch (err) {
      assert.fail('should not throw exception')
    }
  });

  it('test for Unauthorized (401): call authorizeToken service with empty header and auth switch on', async () => {
    //    const req = mockRequest({ headers: [{name: TESTUSER_USERNAME, password: TESTUSER_PASSWORD}] });
    process.env.AUTHORIZATION = 'on';
    const req = mockRequest({ headers: [] }); req.url = '/api/xyz';
    const res = mockResponse();
    const next = sinon.spy();
    try {
      await auth.authorize(req, res, next);
      expect(res.status).to.have.been.calledWith(401);
      expect(next).to.not.have.been.called;
    } catch (err) {
      assert.fail('should not throw exception')
    }
  });

  it('test for Forbidden (403): call authorizeToken service with header but invalid token and auth switch on', async () => {
    //    const req = mockRequest({ headers: [{name: TESTUSER_USERNAME, password: TESTUSER_PASSWORD}] });
    process.env.AUTHORIZATION = 'on';
    const req = mockRequest({ headers: { authorization: 'Bearer xxx.yyy.zzz' } }); req.url = '/api/xyz';
    const res = mockResponse();
    const next = sinon.spy();
    try {
      await auth.authorize(req, res, next);

      expect(res.status).to.have.been.calledWith(403);
      expect(next).to.not.have.been.called;
    } catch (err) {
      assert.fail('should not throw exception')
    }
  });

  it('test for OK (200): call authorizeToken service with header incl. valid token and auth switch on', async () => {
    process.env.AUTHORIZATION = 'on';
    try {
      const result = await util.login(TESTUSER_USERNAME, TESTUSER_PASSWORD);
      const req = mockRequest({ headers: { authorization: `Bearer ${result.accessToken}` } });
      req.url = '/api/xyz';
      const res = mockResponse();
      const next = sinon.spy();
      await auth.authorize(req, res, next);

      expect(res.status).to.have.been.calledWith(200);
      expect(req.user).to.have.property('name'); // name: <Username> was added to request
      expect(next).to.have.been.called;
    } catch (err) {
      assert.fail('should not throw exception')
    }
  });

  it('test for OK (401): call Baisc auth service with header incl. invalid basic authentication  and auth switch on', async () => {
    process.env.AUTHORIZATION = 'on';
    const req = mockRequest({ headers: { authorization: 'Basic asdssdfgsdfjsdfzg=' } });
    req.url = '/api/geofence/';
    req.method = 'POST';
    const res = mockResponse();
    const next = sinon.spy();
    try {
      await auth.authorize(req, res, next);

      expect(res.status).to.have.been.calledWith(401);
      expect(next).not.to.have.been.called;
    } catch (err) {
      assert.fail('should not throw exception')
    }
  });

  after(async () => {
    await User.deleteOne({ name: TESTUSER_USERNAME });
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
    await User.deleteOne({ username: TESTUSER_USERNAME });
    await util.createUser(TESTUSER_USERNAME, TESTUSER_PASSWORD, TESTUSER_NAME, TESTUSER_MAIL);
    await new Promise(resolve => setTimeout(resolve, 100)); // sleep a little while...

    // *** then login to get the access- and refresh token
    const result = await util.login(TESTUSER_USERNAME, TESTUSER_PASSWORD);
    expect(result).to.be.a('object');
    expect(result).to.have.property('accessToken');
    expect(result).to.have.property('refreshToken');
    accessToken = result.accessToken;
    refreshToken = result.refreshToken;
  });

  it('test for NOK (400): call refreshToken but without token', async () => {
    const req = mockRequest({ headers: [], body: { token: null } });
    const res = mockResponse();
    const next = sinon.spy();

    try {
      await auth.refreshToken(req, res, next);
      expect(res.status).to.have.been.calledWith(400);
    } catch (err) {
      assert.fail('should not throw exception')
    }
  });

  it('test for NOK (400): call refreshToken with invalid token', async () => {
    const req = mockRequest({ headers: [], body: { token: 'xxx.yyy.zzz' } });
    const res = mockResponse();
    const next = sinon.spy();

    try {
      await auth.refreshToken(req, res, next);
      // console.log(res.json.getCalls()[0].lastArg)
      expect(res.status).to.have.been.calledWith(400);
    } catch (err) {
      assert.fail('should not throw exception')
    }
  });

  it('test for NOK (400): call refreshToken', async () => {
    const req = mockRequest({ headers: [], params: { token: refreshToken } });
    const res = mockResponse();
    const next = sinon.spy();

    try {
      await auth.refreshToken(req, res, next);
      expect(res.status).to.have.been.calledWith(400);
    } catch (err) {
      assert.fail('should not throw exception')
    }
  });

  after(async () => {
    await User.deleteOne({ name: TESTUSER_USERNAME });
    await Token.deleteOne({ token: refreshToken });
    await Token.deleteMany({ user: TESTUSER_USERNAME });
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
    await User.deleteOne({ username: TESTUSER_USERNAME });
    await util.createUser(TESTUSER_USERNAME, TESTUSER_PASSWORD, TESTUSER_NAME, TESTUSER_MAIL);
    await new Promise(resolve => setTimeout(resolve, 100)); // sleep a little while...
  });

  it('test for OK (200): call logout', async () => {
    // *** login to get the access- and refresh token
    const result = await util.login(TESTUSER_USERNAME, TESTUSER_PASSWORD);
    const token = result.refreshToken;

    let req = mockRequest({ headers: [], body: { token } });
    let res = mockResponse();
    const next = sinon.spy();

    try {
      await auth.logout(req, res, next);
      expect(res.status).to.have.been.calledWith(200);

      // *** authorization should fail now
      process.env.AUTHORIZATION = 'on';
      req = mockRequest({ headers: { authorization: `Bearer ${token}` } }); req.url = '/api/xyz';
      res = mockResponse();

      await auth.authorize(req, res, next);
      expect(res.status).to.have.been.calledWith(403); // Forbidden
      expect(next).to.not.have.been.called;
    } catch (err) {
      assert.fail('should not throw exception')
    }
  });

  it('test for NOK (400): call logout but without token', async () => {
    const req = mockRequest({ headers: [], body: { token: null } });
    const res = mockResponse();
    const next = sinon.spy();

    try {
      await auth.logout(req, res, next);
      expect(res.status).to.have.been.calledWith(400);
    } catch (err) {
      assert.fail('should not throw exception')
    }
  });

  it('test for NOK (400): call logout with invalid token', async () => {
    const req = mockRequest({ headers: [], params: { token: 'xxx.yyy.zzz' } });
    const res = mockResponse();
    const next = sinon.spy();

    try {
      await auth.logout(req, res, next);
      // console.log(res.json.getCalls()[0].lastArg)
      expect(res.status).to.have.been.calledWith(400);
    } catch (err) {
      assert.fail('should not throw exception')
    }
  });

  after(async () => {
    await User.deleteOne({ username: TESTUSER_USERNAME });
    await Token.deleteMany({ user: TESTUSER_USERNAME });
  });
});

