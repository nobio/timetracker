/* eslint-disable max-len */
/* eslint-disable no-underscore-dangle */
require('./init');
require('../db');
const mongoose = require('mongoose');
const moment = require('moment');
require('moment-timezone');

const TimeEntry = mongoose.model('TimeEntry');

const Mocha = require('mocha');
const Chai = require('chai');

const { describe, it } = Mocha;
const { assert, expect } = Chai;

const util = require('../api/entries/util-entries');

const DEFAULT_DATE = moment('1967-03-16');
const TWO_ENTRIES = [
  {
    last_changed: '2014-02-27T07:37:02.543Z',
    entry_date: '2014-02-27T07:37:00.000Z',
    __v: 0,
    _id: '530eeb1ea8ee5e0000000917',
    direction: 'enter',
  },
  {
    __v: 0,
    last_changed: '2014-02-27T15:55:56.607Z',
    entry_date: '2014-02-27T15:55:00.000Z',
    _id: '530f600ca8ee5e00000009f0',
    direction: 'go',
  },
];

const ONE_ENTRY = [
  {
    last_changed: '2014-02-27T07:37:02.543Z',
    entry_date: '2014-02-27T07:37:00.000Z',
    __v: 0,
    _id: '530eeb1ea8ee5e0000000917',
    direction: 'enter',
  },
];

const TWO_ENTRIES_AOK = [
  { direction: 'enter', entry_date: '2022-02-20T07:00:00.00Z', last_changed: '2022-02-20T07:00:00.00Z' },
  { direction: 'go', entry_date: '2022-02-20T16:00:00.000Z', last_changed: '2022-02-20T16:00:00.000Z' },
];

const FOUR_ENTRIES_AOK = [
  { direction: 'enter', entry_date: '2022-02-20T07:30:00.00Z', last_changed: '2022-02-20T07:30:00.00Z' },
  { direction: 'go', entry_date: '2022-02-20T12:00:00.000Z', last_changed: '2022-02-20T12:00:00.000Z' },
  { direction: 'enter', entry_date: '2022-02-20T12:45:00.00Z', last_changed: '2022-02-20T12:45:00.00Z' },
  { direction: 'go', entry_date: '2022-02-20T17:00:00.000Z', last_changed: '2022-02-20T17:00:00.000Z' },
];

// ####################################################################################
// ##
// ##  TEST Cases
// ##
// ####################################################################################
describe('test util.getAllByDate ', () => {
  it('response array should have length of 0', async () => { expect(await util.getAllByDate(-1)).to.have.length(0); });
  it('response array should have length of 2', async () => { expect(await util.getAllByDate(1393455600000)).to.have.length(2); });
  it('response array should have length of 0', async () => { expect(await util.getAllByDate(1000000000000)).to.have.length(0); });
  it('response array should have length of 0', async () => { expect(await util.getAllByDate(0)).to.have.length(0); });
});

describe('test util.calculateBusyTime', () => {
  it('should not have any entries', async () => {
    expect(await util.calculateBusyTime([])).to.be.empty;
  });

  it('should be rejected if only one entry', async () => {
    try {
      await util.calculateBusyTime(ONE_ENTRY);
      assert.fail('should throw Error but did not :-('); // should not reach this...
    } catch (err) {
      expect(err).to.be.an('error');
      expect(err.message).to.equal('Bitte vervollständigen Sie die Einträge');
    }
  });

  it('should not be rejected if the second entry is a go', async () => {
    try {
      await util.calculateBusyTime(TWO_ENTRIES);
    } catch (error) {
      assert.fail('should not throw an exception!');
    }
  });
  it('should be rejected if the second entry is not a go', async () => {
    const ENTRIES = [
      { direction: 'enter' },
      { direction: 'enter' },
    ];

    try {
      await util.calculateBusyTime(ENTRIES);
      assert.fail('should throw Error but did not :-('); // should not reach this...
    } catch (err) {
      expect(err).to.be.an('error');
      expect(err.message).to.equal('Die Reihenfolge der Kommen/Gehen-Einträge scheint nicht zu stimmen.');
    }
  });
  it('calculate duration, bustyme, pause (before AOK, 2 Entries)', async () => {
    const result = await util.calculateBusyTime(TWO_ENTRIES);

    expect(result).to.have.property('duration');
    expect(result.duration).to.equal(29880000);
    expect(result).to.have.property('busytime');
    expect(result.busytime).to.equal(27180000);
    expect(result).to.have.property('pause');
    expect(result.pause).to.equal(2700000);
    expect(result).to.have.property('count');
    expect(result.count).to.equal(2);
  });
  it('calculate duration, bustyme, pause (AOK, 2 Entries)', async () => {
    const result = await util.calculateBusyTime(TWO_ENTRIES_AOK);

    expect(result).to.have.property('duration');
    expect(result.duration).to.equal(32400000);
    expect(result).to.have.property('busytime');
    expect(result.busytime).to.equal(29700000);
    expect(result).to.have.property('pause');
    expect(result.pause).to.equal(2700000);
    expect(result).to.have.property('count');
    expect(result.count).to.equal(2);
  });
  it('calculate duration, bustyme, pause (AOK, 4 Entries)', async () => {
    const result = await util.calculateBusyTime(FOUR_ENTRIES_AOK);

    expect(result).to.have.property('duration');
    expect(result.duration).to.equal(34200000);
    expect(result).to.have.property('busytime');
    expect(result.busytime).to.equal(31500000);
    expect(result).to.have.property('pause');
    expect(result.pause).to.equal(2700000);
    expect(result).to.have.property('count');
    expect(result.count).to.equal(4);
  });
});

describe('test find one TimeEntry by its id:  -> util.findById() ', () => {
  it('should find one Time Entry by its id', async () => {
    // find any valid time entry to get a valid id
    const lastTimeEntry = await util.getLastTimeEntryByDate('2017-12-19T19:34:00.000Z');
    const timeentry = await util.findById(lastTimeEntry._id);

    // console.log(timeentry)
    expect(timeentry).to.have.property('_id');
    expect(timeentry).to.have.property('direction');
    expect(timeentry).to.have.property('longitude');
    expect(timeentry).to.have.property('latitude');
    expect(timeentry).to.have.property('__v');
    expect(timeentry).to.have.property('direction');
    expect(timeentry).to.have.property('last_changed');
    expect(timeentry).to.have.property('entry_date');
  });
  it('should not find a Time Entry by an invalid id', async () => {
    try {
      await util.findById('********_invalid-id_********'); assert.fail('should throw exception name: Path `name` is required');
    } catch (error) {
      expect(error.message).to.eq('Cast to ObjectId failed for value \"********_invalid-id_********\" (type string) at path \"_id\" for model \"TimeEntry\"');
    }
  });
});

describe('test to load the last TimeEntry of a given date: -> util.getLastTimeEntryByDate(dt) ', () => {
  it('check the last entry of a given date', async () => {
    const MY_DATE = moment('2018-01-12');
    const timeEntry = await util.getLastTimeEntryByDate(MY_DATE);
    // console.log(timeEntry)
    expect(timeEntry).to.not.be.null;
    expect(timeEntry).to.not.be.undefined;
    expect(timeEntry).to.have.property('entry_date');
    expect(moment(timeEntry.entry_date).format('YYYY-MM-DD')).to.equal('2018-01-12');
    expect(moment(timeEntry.entry_date).format('mm:ss')).to.equal('22:56');
  });

  it('last entry of an empty date (in the future) must be undefined', async () => {
    const MY_DATE = moment('2050-01-01');
    const timeEntry = await util.getLastTimeEntryByDate(MY_DATE);
    // console.log(timeEntry)
    expect(timeEntry).to.be.undefined;
  });
});

describe('test to create one TimeEntry:  -> util.create()', () => {
  before(async () => {
    await clearAllEntries(DEFAULT_DATE);
  });

  it('create successfully a new TimeEntry', async () => {
    try {
      // 1. crete a time entry....
      let timeEntry = await util.create({ direction: 'enter', datetime: DEFAULT_DATE });
      // console.log(timeEntry._id)
      expect(timeEntry).to.not.be.undefined;
      expect(timeEntry).to.have.property('_id');
      expect(timeEntry._id).to.not.be.undefined;
      expect(timeEntry._id).to.not.be.a('string');
      expect(timeEntry).to.have.property('__v');
      expect(timeEntry).to.have.property('last_changed');
      expect(timeEntry).to.have.property('entry_date');
      expect(moment(timeEntry.entry_date).format('YYYY-MM-DD')).to.equal('1967-03-16');
      expect(timeEntry).to.have.property('longitude');
      expect(timeEntry).to.have.property('latitude');
      expect(timeEntry).to.have.property('direction');
      expect(timeEntry.direction).to.equal('enter');
      const id = timeEntry._id;

      // 2. read the time entry -> should not null
      timeEntry = await util.findById(id);
      expect(timeEntry).to.not.be.null;

      // 3. delete the time entry again...
      await util.deleteById(id);

      // 4. now read the time entry -> should be null
      timeEntry = await util.findById(id);
      expect(timeEntry).to.be.null;
    } catch (error) {
      console.log(`no error should occure; instead: ${error.message}`);
      await clearAllEntries(DEFAULT_DATE);
      throw error;
    }
  });

  it('create not successfully a new TimeEntry: first entry must not have direction "go"', async () => {
    try {
      await util.create('go', DEFAULT_DATE); assert.fail('should throw exception name: Path `name` is required');
    } catch (error) {
      console.log(error);
      expect(error.message).to.eq('Unable to read Time Entry for given date : undefined (Cast to date failed for value "Moment<Invalid date>" (type Moment) at path "entry_date" for model "TimeEntry")');
    }
  });

  it('create not successfully: enter one entry with direction "enter" and then another one also with direction "enter"', async () => {
    try {
      const timeEntry = await util.create({ direction: 'enter', datetime: DEFAULT_DATE });
      await util.create({ direction: 'enter', datetime: DEFAULT_DATE });
      assert.fail('should throw Error but did not :-('); // should not reach this...
    } catch (err) {
      expect(err).to.be.an('error');
      expect(err.message).to.equal('this entry has direction enter but last entry has also direction enter');
      await clearAllEntries(DEFAULT_DATE);
    }
  });

  it('create successfully a new TimeEntry without datetime', async () => {
    try {
      // 1. crete a time entry....
      let timeEntry = await util.create({ direction: 'enter', datetime: DEFAULT_DATE });
      // console.log(timeEntry)
      expect(timeEntry).to.not.be.undefined;
      expect(timeEntry).to.have.property('_id');
      expect(timeEntry._id).to.not.be.undefined;
      expect(timeEntry._id).to.not.be.a('string');
      expect(timeEntry).to.have.property('__v');
      expect(timeEntry).to.have.property('last_changed');
      expect(timeEntry).to.have.property('entry_date');
      expect(moment(timeEntry.entry_date).format('YYYY-MM-DD')).to.equal('1967-03-16');
      expect(timeEntry).to.have.property('longitude');
      expect(timeEntry).to.have.property('latitude');
      expect(timeEntry).to.have.property('direction');
      expect(timeEntry.direction).to.equal('enter');
      const id = timeEntry._id;

      // 2. read the time entry -> should not null
      timeEntry = await util.findById(id);
      expect(timeEntry).to.not.be.null;

      // 3. delete the time entry again...
      await util.deleteById(id);

      // 4. now read the time entry -> should be null
      timeEntry = await util.findById(id);
      expect(timeEntry).to.be.null;
    } catch (error) {
      console.log(`no error should occure; instead: ${error.message}`);
      await clearAllEntries(DEFAULT_DATE);
      throw error;
    }
  });
});

describe('test delete one TimeEntry by its id:  -> util.deleteById() ', () => {
  it('should delete one Time Entry by its id', async () => {
    // create new entry (which will be deleted later)
    try {
      const timeEntry = await create({ direction: 'enter', datetime: DEFAULT_DATE });
      const delID = await util.deleteById(timeEntry.id);
      const nullTimeEntry = await util.findById(delID);
      expect(nullTimeEntry).to.be.null;
    } catch (error) {
      await clearAllEntries(DEFAULT_DATE);
      throw err;
    }
  });
});

describe('test to modify one TimeEntry:  -> util.update() ', () => {
  it('modify successfully a new TimeEntry', async () => {
    try {
      // 1. create a TimeEntry with direction "enter"
      let timeEntry = await create({ direction: 'enter', datetime: DEFAULT_DATE });
      expect(timeEntry).to.not.be.undefined;
      expect(timeEntry).to.have.property('_id');
      expect(timeEntry).to.have.property('id');
      expect(timeEntry._id).to.not.be.undefined;
      expect(timeEntry._id).to.not.be.a('string');
      expect(timeEntry).to.have.property('__v');
      expect(timeEntry).to.have.property('last_changed');
      expect(timeEntry).to.have.property('entry_date');
      expect(timeEntry).to.have.property('direction');
      expect(timeEntry.direction).to.equal('enter');
      expect(moment(timeEntry.entry_date).format('YYYY-MM-DD')).to.equal('1967-03-16');
      expect(timeEntry).to.have.property('longitude');

      // 2. update TimeEntry with direction go
      timeEntry.direction = 'go';
      timeEntry = await util.update(timeEntry);
      expect(timeEntry).to.not.be.undefined;
      expect(timeEntry).to.have.property('_id');
      expect(timeEntry).to.have.property('id');
      expect(timeEntry._id).to.not.be.undefined;
      expect(timeEntry._id).to.not.be.a('string');
      expect(timeEntry).to.have.property('__v');
      expect(timeEntry).to.have.property('last_changed');
      expect(timeEntry).to.have.property('entry_date');
      expect(timeEntry).to.have.property('direction');
      expect(timeEntry.direction).to.equal('go');
      expect(moment(timeEntry.entry_date).format('YYYY-MM-DD')).to.equal('1967-03-16');
      expect(timeEntry).to.have.property('longitude');

      // 3. find TimeEntry by id
      await new Promise((resolve) => setTimeout(resolve, 500));
      timeEntry = await util.findById(timeEntry.id);
      expect(timeEntry).to.not.be.undefined;
      expect(timeEntry).to.have.property('_id');
      expect(timeEntry).to.have.property('id');
      expect(timeEntry._id).to.not.be.undefined;
      expect(timeEntry._id).to.not.be.a('string');
      expect(timeEntry).to.have.property('__v');
      expect(timeEntry).to.have.property('last_changed');
      expect(timeEntry).to.have.property('entry_date');
      expect(timeEntry).to.have.property('direction');
      expect(timeEntry.direction).to.equal('go');
      expect(moment(timeEntry.entry_date).format('YYYY-MM-DD')).to.equal('1967-03-16');
      expect(timeEntry).to.have.property('longitude');

      // 4. delete TimeEntry
      await util.deleteById(timeEntry.id);

      // 5. now read the time entry -> should be null
      timeEntry = await util.findById(timeEntry.id);
      expect(timeEntry).to.be.null;
    } catch (error) {
      console.log(`no error should occure; instead: ${error.message}`);
      await clearAllEntries(DEFAULT_DATE);
      throw error;
    }
  });

  it('should throw exception when passing an undefined object', async () => {
    try {
      await util.update();
      assert.fail('should throw Error but did not :-('); // should not reach this...
    } catch (err) {
      expect(err).to.be.an('error');
      expect(err.message).to.equal('to update a record, the passed object must not be undefined');
    }
  });

  after(async () => {
    await clearAllEntries(DEFAULT_DATE);
  });
});

describe('test util.markADay ', () => {
  it('mark a date as vacation', async () => {
    await clearAllEntries(DEFAULT_DATE);
    try {
      await util.markADay(DEFAULT_DATE, 'vacation');
      const entries = await util.getAllByDate(DEFAULT_DATE);
      expect(entries.length).to.equal(2);
      expect(entries[0].mark).to.equal('vacation');
    } catch (error) {
      throw error;
    }
  });
  it('mark a date as sick-leave', async () => {
    await clearAllEntries(DEFAULT_DATE);
    try {
      await util.markADay(DEFAULT_DATE, 'sick-leave');
      const entries = await util.getAllByDate(DEFAULT_DATE);
      expect(entries.length).to.equal(2);
      expect(entries[0].mark).to.equal('sick-leave');
    } catch (error) {
      throw error;
    }
  });
  it('create a normal time entry and check if this is marked as `work`', async () => {
    await clearAllEntries(DEFAULT_DATE);
    try {
      const timeEntry = await util.create({ direction: 'enter', datetime: DEFAULT_DATE });
      expect(timeEntry.mark).to.equal('work');
    } catch (error) {
      throw error;
    }
  });
  it('mark a date with a non existing mark', async () => {
    await clearAllEntries(DEFAULT_DATE);
    try {
      await util.markADay(DEFAULT_DATE, 'NOT-EXISTING-MARK');
      assert('should throw an error: TimeEntry validation failed: mark: `NOT-EXISTING-MARK` is not a valid enum value for path `mark`.');
    } catch (error) {
      // nothing to do, we expect an error
    }
  });

  after(async () => {
    await clearAllEntries(DEFAULT_DATE);
  });
});

describe('test util.storeValidationErrors ', () => {
  it('getErrorDates', async () => {
    try {
      const errorDates = await util.getErrorDates();
      expect(errorDates).to.be.an('array');
    } catch (error) {
      assert.fail('should not throw an error here');
    }
  });

  after(async () => {
    clearAllEntries(DEFAULT_DATE);
  });

  it('evaluate', async () => {
    const firstTime = { age: moment('2018-01-13T06:30:00.000Z') };
    const lastTime = { age: moment('2018-12-15T14:09:49.314Z') };
    const result = await util.evaluate(firstTime, lastTime);
    expect(result).to.have.property('message');
    expect(result.message).to.equal('calculation ongoing in background');
  });

  it('storeValidationErrors', async () => {
    const firstTime = { age: moment('2018-01-13T06:30:00.000Z') };
    const lastTime = { age: moment('2018-12-15T14:09:49.314Z') };

    try {
      const result = await util.storeValidationErrors(firstTime, lastTime);
      expect(result).to.have.property('message');
      expect(result.message).to.equal('calculation ongoing in background');
    } catch (error) {
      console.log(error);
      assert.fail('should not throw an error here');
    }
  });
});

// ########################################################################################################
// #
// # functions
// #
// ########################################################################################################
/**
 * create a new TimeEntry regardless other entries. No checks will be performed - not like util.crea
 */
function create(timeEntry) {
  // console.log('entered save ' + id)
  return new Promise((resolve, reject) => {
    new TimeEntry({
      entry_date: timeEntry.datetime,
      direction: timeEntry.direction,
      longitude: timeEntry.longitude,
      latitude: timeEntry.latitude,
    }).save()
      .then((timeEntry) => resolve(timeEntry))
      .catch((err) => reject(err));
  });
}

/**
 *
 * @param {*} date date to delete all entries which might have stayed because of any error
 */
async function clearAllEntries(dt) {
  const timeentries = await util.getAllByDate(dt);
  for (const timeentry of timeentries) {
    await util.deleteById(timeentry._id);
  }
}
