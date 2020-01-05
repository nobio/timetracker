require('../db');
const mongoose = require('mongoose');

const User = mongoose.model('User');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const expect = chai.expect;
const assert = chai.assert;
const should = chai.should;

const util = require('../api/auth/util-auth');

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

  after(() => {
    // db.closeConnection();
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

        expect(result).to.be.a('string');
        expect(result).to.equal('User authenticated');
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
  });

  after(async () => {
    await User.deleteOne({ name: TESTUSER_NAME });
    db.closeConnection();
  });
});
