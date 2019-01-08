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
    console.log(result);
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
    console.log(result);
    expect(result).to.have.property('toggle');
    expect(result.toggle).to.equal(true); // Default value is "false"
    expect(result).to.have.property('name');
    expect(result.name).to.equal(toggleName);
   })
   .catch((err) => { throw err; });
 });

 after(() => {
  //util.deleteTestToggles()
  //.then(result => console.log(JSON.stringify(result)))
  db.closeConnection()
 });
});
