require('./init');
const mongoose = require('mongoose');
const fs = require('fs');

const util = require('../api/admin/util-admin');

const chai = require('chai');
const { resolve } = require('path');
//const chaiAsPromised = require('chai-as-promised');
//chai.use(chaiAsPromised);
const expect = chai.expect;
const assert = chai.assert;

require('moment-timezone');

/** ************************************************************ */
const rmDir = function (dirPath, removeSelf) {
  let files;
  let bRemoveSelf = removeSelf;
  if (removeSelf === undefined) {
    bRemoveSelf = true;
  }

  try {
    files = fs.readdirSync(dirPath);
  } catch (e) {
    return;
  }

  if (files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      const filePath = `${dirPath}/${files[i]}`;
      if (fs.statSync(filePath).isFile()) fs.unlinkSync(filePath);
      else rmDir(filePath);
    }
  }
  if (bRemoveSelf) fs.rmdirSync(dirPath);
};
/** ************************************************************ */


describe('test util.dumpModels', () => {
  before(() => {
    db = require('../db');
    rmDir('./dump');
  });

  it.only('dumping the Model Toggle; should lead to a new file in /dump', async () => {
    try {
      //const result = await util.dumpModel(mongoose.model('Toggle'));
      const result = await util.dumpModels();
      console.log(result)
      expect(result).to.be.an('array');
      expect(result.length).to.gt(0);
      expect(result[0]).to.have.property('size');
      expect(result[0]).to.have.property('filename');

      const data = fs.readFileSync(result[0].filename);
      expect(data).to.not.be.empty;

    } catch (error) {
      console.log(error);
      assert.fail('should not throw exception')
    }
  }).timeout(20000);
});
describe('test util.backupTimeEnties', () => {
  it.skip('backing up the database', async () => {
    try {
      const result = await util.backupTimeEntries();
      console.log(result)
      expect(result).to.have.property('backup_count');
    } catch (error) {
      assert.fail('should not throw exception')
    }
  }).timeout(10000);
});
