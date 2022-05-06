require('./init');
const { assert } = require('chai');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
const { expect } = chai;
const util = require('../api/admin/util-properties');

const TEST_KEY = 'TEST_KEY';
const TEST_VALUE = 'TEST_VALUE';

describe('test read properties', () => {
  it('read all properties', async () => {
    props = await util.getProperties();
    expect(props).to.be.a('array');
    expect(props.length).to.be.greaterThan(0);
    expect(props[0]).to.be.a('object');
    expect(props[0]).to.have.property('key');
    expect(props[0]).to.have.property('value');
  });
});

describe('test read one perticular property', () => {
  before(async () => {
    // make sure, TEST_KEY property is available
    await util.setProperty(TEST_KEY, TEST_VALUE);
  });

  it('read an existing property', async () => {
    prop = await util.getProperty(TEST_KEY);
    expect(prop).to.be.a('object');
    expect(prop).to.have.property('key');
    expect(prop.key).to.equal(TEST_KEY);
    expect(prop).to.have.property('value');
    expect(prop.value).to.equal(TEST_VALUE);
  });

  it('try to read a not existing property', async () => {
    prop = await util.getProperty('NOTEXISITINGKEY');
    expect(prop).to.be.null;
  });

  it('try to read property with an undefined key', async () => {
    try {
      prop = await util.getProperty();
    } catch (err) {
      expect(err).to.be.an('error');
      expect(err.message).to.equal('the key must not be undefined');
    }
  });

  it('try to read property with an null key', async () => {
    try {
      prop = await util.getProperty(null);
    } catch (err) {
      expect(err).to.be.an('error');
      expect(err.message).to.equal('the key must not be undefined');
    }
  });

  after(async () => {
    // delete the test property again
    await util.deleteProperty(TEST_KEY);
  });
});

describe('test set a property', () => {
  before(async () => {
    // delete the test property again
    await util.deleteProperty(TEST_KEY);
  });

  it('set a new property', async () => {
    prop = await util.setProperty(TEST_KEY, TEST_VALUE);
    expect(prop).to.be.a('object');
    expect(prop).to.have.property('key');
    expect(prop.key).to.equal(TEST_KEY);
    expect(prop).to.have.property('value');
    expect(prop.value).to.equal(TEST_VALUE);
  });

  it('update an exsisting property', async () => {
    // create a new property
    prop = await util.setProperty(TEST_KEY, TEST_VALUE);

    // update the property with a new vale
    prop = await util.setProperty(TEST_KEY, `${TEST_VALUE}_NEW`);
    expect(prop.value).to.equal(`${TEST_VALUE}_NEW`);

    // read the propertie's new value
    prop = await util.getProperty(TEST_KEY);
    expect(prop.value).to.equal(`${TEST_VALUE}_NEW`);
  });

  it('update an exsisting property with undefined value', async () => {
    // create a new property
    prop = await util.setProperty(TEST_KEY, TEST_VALUE);

    // update the property with a new vale
    try {
      prop = await util.setProperty(TEST_KEY);
    } catch (err) {
      expect(err).to.be.an('error');
      expect(err.message).to.equal('the value must not be undefined');
    }
  });

  it('update an exsisting property with null value', async () => {
    // create a new property
    prop = await util.setProperty(TEST_KEY, TEST_VALUE);

    // update the property with a new vale
    try {
      prop = await util.setProperty(TEST_KEY, null);
    } catch (err) {
      expect(err).to.be.an('error');
      expect(err.message).to.equal('the value must not be undefined');
    }
  });

  it('set a new property with null key', async () => {
    try {
      prop = await util.setProperty(null, TEST_VALUE);
    } catch (err) {
      expect(err).to.be.an('error');
      expect(err.message).to.equal('the key must not be undefined');
    }
  });

  after(async () => {
    // delete the test property again
    await util.deleteProperty(TEST_KEY);
  });
});

describe('test delete a property', () => {
  before(async () => {
    // delete the test property again
    await util.deleteProperty(TEST_KEY);
  });

  it('set a new property and delete it', async () => {
    // create a new property
    prop = await util.setProperty(TEST_KEY, TEST_VALUE);
    expect(prop.key).to.equal(TEST_KEY);
    expect(prop.value).to.equal(TEST_VALUE);

    // delete the property
    prop = await util.deleteProperty(TEST_KEY);
    expect(prop.key).to.equal(TEST_KEY);
    expect(prop.value).to.equal(TEST_VALUE);

    // try to read the deleted property
    prop = await util.getProperty(TEST_KEY);
    expect(prop).to.be.null;
  });

  it('try to delete a not exisiting property', async () => {
    try {
      prop = await util.deleteProperty('LIAJSOUHNALSKDNKABSIBAKJSN');
    } catch (err) {
      expect(err).to.be.an('error');
      expect(err.message).to.equal('the key must not be undefined');
    }
  });

  it('try to delete a property with an undefined key', async () => {
    try {
      prop = await util.deleteProperty();
    } catch (err) {
      expect(err).to.be.an('error');
      expect(err.message).to.equal('the key must not be undefined');
    }
  });

  it('try to delete a property with an null key', async () => {
    try {
      prop = await util.deleteProperty(null);
    } catch (err) {
      expect(err).to.be.an('error');
      expect(err.message).to.equal('the key must not be undefined');
    }
  });

  after(async () => {
    // delete the test property again
    await util.deleteProperty(TEST_KEY);
  });
});
