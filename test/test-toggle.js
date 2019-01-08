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
  const toggleName = 'TEST-TOGGLE-' + Math.round(Math.random() * 100000000);

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
  const toggleName = 'TEST-TOGGLE-' + Math.round(Math.random() * 100000000);

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
  //util.deleteTestToggles()
  //.then(result => console.log(JSON.stringify(result)))
  //db.closeConnection()
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
