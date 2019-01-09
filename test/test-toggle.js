require('../db');
const fs = require('fs');
const mongoose = require('mongoose');
const Toggle = mongoose.model('Toggle');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const expect = chai.expect;
const assert = chai.assert;
const should = chai.should;

const util = require('../api/admin/util-admin');

describe('test util.createToggle - Promise', () => {
 let db;
 before(() => {
  db = require('../db');
 });

 it('creating a new toggle with name, that does not exist without toggle value', async() => {
  const toggleName = getToggleTestName();

  await util.createToggle(toggleName)
   .then((result) => {
    expect(result).to.have.property('toggle');
    expect(result.toggle).to.equal(false); // Default value is "false"
    expect(result).to.have.property('name');
    expect(result.name).to.equal(toggleName);
   })
   .catch((err) => { throw err; });
 });

 it('creating a new toggle with name, that does not exist with given toggle value', async() => {
  const toggleName = getToggleTestName();

  await util.createToggle(toggleName, true)
   .then((result) => {
    expect(result).to.have.property('toggle');
    expect(result.toggle).to.equal(true); // Default value is "false"
    expect(result).to.have.property('name');
    expect(result.name).to.equal(toggleName);
   })
   .catch((err) => { throw err; });
 });


 it('creating a new toggle without name; should fail', async() => expect(util.createToggle()).to.be.rejected);
 it('creating a new toggle without name; should fail', async() => expect(util.createToggle('')).to.be.rejected);
 it('creating a new toggle without name but toggle; should fail', async() => expect(util.createToggle('', true)).to.be.rejected);


 after(() => {
  // db.closeConnection()
 });
});

describe('test util.getAllToggles - Promise', () => {
 let db;
 before(() => {
  db = require('../db');
 });

 it('load all toggles', async() => {
  await util.getAllToggles()
   .then((result) => {
    expect(result).to.be.an('array');
    expect(result[0]).not.to.be.empty
    expect(result[0]).to.have.property('toggle');
    expect(result[0]).to.have.property('name');
   })
   .catch((err) => { throw err; });
 });

 after(() => {
  // db.closeConnection()
 });
});

describe('test util.getToggle - Promise', () => {
 let db;
 before(() => {
  db = require('../db');
 });

 it('load one toggle', async() => {
  await util.getAllToggles()
   .then((result) => util.getToggle(result[0]._id))
   .then((result) => {
    expect(result).to.have.property('toggle');
    expect(result).to.have.property('name');
   })
   .catch((err) => { throw err; });
 });

 it('load one not existing toggle; should fail', async() => expect(util.getToggle('12345')).to.be.rejected);

 after(() => {
  // db.closeConnection()
 });
});

describe('test util.updateToggle - Promise', () => {
 let db;
 before(() => {
  db = require('../db');
 });

 it('update existing toggle', async() => {
  const toggleName = getToggleTestName();

  await util.createToggle(toggleName, false)
   .then(newToggle => {
    expect(newToggle.toggle).to.equal(false)
    return newToggle._id;
   })
   .then(id => util.updateToggle(id, true))
   .then(toggle => util.getToggle(toggle._id))
   .then(result => {
    expect(result).not.to.be.null;
    expect(result.toggle).to.equal(true)
   })
   .catch((err) => { throw err; });
 });

 it('update not existing toggle', async() => {

  await util.updateToggle('41224d776a326fb40f000001', true)
   .then(toggle => {
    expect(toggle).to.be.null;
   })
   .catch((err) => { throw err; });
 });


 after(() => {
  // db.closeConnection()
 });
});

describe('test util.deleteToggle - Promise', () => {
 const toggleName = getToggleTestName();

 let db;
 before(() => {
  db = require('../db');
 });

 it('delete an existing toggle', async() => {
  await util.createToggle(toggleName, 'true')
   .then(newToggle => {
    return newToggle._id;
   })
   .then(id => util.deleteToggle(id))
   .then(toggle => util.getToggle(toggle._id))
   .then(result => {
    expect(result).to.be.null;
   })
   .catch((err) => { throw err; });
 });


 it('try to delete a not existing toggle', async() => {
  await util.deleteToggle('41224d776a326fb40f000001')
   .then(result => {
    expect(result).to.be.null;
   })
   .catch((err) => { throw err; });
 });


 after(() => {
  util.deleteTestToggles()
   .then(result => console.log(JSON.stringify(result)))
  //db.closeConnection()
 });
});

function getToggleTestName() {
 return 'TEST-TOGGLE-' + Math.round(Math.random() * 100000000);
}
