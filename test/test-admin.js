/* eslint-disable no-undef */
require('./init');
const mongoose = require('mongoose');

const fs = require('fs');
const moment = require('moment');

const Chai = require('chai');
const Mocha = require('mocha');
const util = require('../api/admin/util-admin');

const { describe, it } = Mocha;
const { expect, assert } = Chai;

const DUMP_DIR = './dump';

require('moment-timezone');

/** ************************************************************ */

describe('test util.dumpModels', () => {
  beforeEach(() => {
    db = require('../db');
    fs.rmSync(DUMP_DIR, { recursive: true, force: true }, (err) => { console.log(err); });
  });

  afterEach(() => {
    fs.rmSync(DUMP_DIR, { recursive: true, force: true }, (err) => { console.log(err); });
  });

  it('dumping the Model Toggle; should lead to a new file in /dump', async () => {
    try {
      // const result = await util.dumpModel(mongoose.model('Toggle'));
      const result = await util.dumpModels();

      // console.log(result)
      expect(result).to.be.an('array');
      expect(result.length).to.gt(0);
      expect(result[0]).to.have.property('size');
      expect(result[0]).to.have.property('filename');

      const data = fs.readFileSync(result[0].filename);
      expect(data).to.not.be.empty;
    } catch (error) {
      console.log(error);
      assert.fail('should not throw exception');
    }
  }).timeout(50000);

  it('testing deletion of files older 31 days', async () => {
    const DAYS_IN_PAST = 31 + 10;
    // create the dump directory and files with names indicating dates from today tol DAYS_IN_PAST
    fs.mkdirSync(DUMP_DIR);
    for (let n = 1; n < DAYS_IN_PAST; n++) {
      const d = moment().subtract(n, 'days').format('YYYY-MM-DD_HHmmss');
      const dumpFile = `./dump/deleteme_${d}.json.gz`;
      fs.writeFileSync(dumpFile, Buffer.from('please delete me if you find me', 'utf-8'));
    }

    // delete files older today - 31 days
    await util.testWrapperDeleteOldDumpfiles();

    // read files from dump directory
    const dirContent = fs.readdirSync(DUMP_DIR);
    // console.log(dirContent)

    // first file date should be today - 32 because today - 31 are deleted
    const lastDateFileShouldExist = moment().subtract(31, 'days').format('YYYY-MM-DD');

    // get first (=oldest) file name
    const firstFileName = dirContent[0];

    // oldest file date (like '2024-01-14') should be included in first filename like 'deleteme_2024-01-14_075838.json.gz'
    expect(firstFileName).to.include(lastDateFileShouldExist);
    expect(dirContent.length).to.equal(31);
  });
});

describe('test util.restoreDataFromFile', () => {
  before(() => {
    db = require('../db');
    fs.rmSync(DUMP_DIR, { recursive: true, force: true }, (err) => { console.log(err); });
  });

  after(() => {
    fs.rmSync(DUMP_DIR, { recursive: true, force: true }, (err) => { console.log(err); });
  });

  it('restore data (Toggle)', async () => {
    const Toggle = mongoose.model('Toggle');

    // export Toggles
    let result = await util.testWrapperDumpModel(Toggle);
    // result: { size: 15, filename: './dump/Toggle_2024-02-15_091657.json.gz' }
    expect(result).to.have.property('size');
    expect(result).to.have.property('filename');

    // check if there are entries in database
    let toggles = await Toggle.find();
    expect(toggles).to.be.an('array');
    expect(toggles.length).to.greaterThan(0);
    const countToggles = toggles.length; // needed to test against later

    // delete Toggle in Database
    await Toggle.deleteMany();
    toggles = await Toggle.find();
    expect(toggles).to.be.an('array');
    expect(toggles.length).to.equal(0);

    // restore from file
    result = await util.restoreDataFromFile();
    console.log(result);
    toggles = await Toggle.find();
    expect(toggles).to.be.an('array');
    expect(toggles.length).to.equal(countToggles);
  }).timeout(50000);
});

describe('test util.backupTimeEnties', () => {
  it.skip('backing up the database', async () => {
    try {
      const result = await util.backupTimeEntries();
      console.log(result);
      expect(result).to.have.property('backup_count');
    } catch (error) {
      assert.fail('should not throw exception');
    }
  }).timeout(50000);
});
