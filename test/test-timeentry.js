require('../db');
const mongoose = require('mongoose');

const TimeEntry = mongoose.model('TimeEntry');
const util = require('../api/entries/util-entries');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const expect = chai.expect;

const moment = require('moment');
const { assert } = require('chai');
require('moment-timezone');

const DEFAULT_DATE = moment('1967-03-16');
const TWO_ENTRIES =
  [
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

const ONE_ENTRY =
  [
    {
      last_changed: '2014-02-27T07:37:02.543Z',
      entry_date: '2014-02-27T07:37:00.000Z',
      __v: 0,
      _id: '530eeb1ea8ee5e0000000917',
      direction: 'enter',
    },
  ];

// ####################################################################################
// ##
// ##  TEST Cases
// ##
// ####################################################################################
describe('test util.getAllByDate ', () => {
  it('response array should have length of 0', async () => { expect(await util.getAllByDate(-1)).to.have.length(0) });
  it('response array should have length of 2', async () => { expect(await util.getAllByDate(1393455600000)).to.have.length(2) });
  it('response array should have length of 0', async () => { expect(await util.getAllByDate(1000000000000)).to.have.length(0) });
  it('response array should have length of 0', async () => { expect(await util.getAllByDate(0)).to.have.length(0) });
});

describe('test util.calculateBusyTime', () => {
  it('should not have any entries', async () => {
    expect(await util.calculateBusyTime([])).to.be.empty;
  });

  it('should be rejected if only one entry', async () => {
    try {
      await util.calculateBusyTime(ONE_ENTRY);
      assert.fail("should throw Error but did not :-("); // should not reach this...
    } catch (err) {
      expect(err).to.be.an('error');
      expect(err.message).to.equal('Bitte vervollständigen Sie die Einträge');
    }
  });

  it('should be rejected if the second entry is not a go', async () => {
    const ENTRIES =
      [
        { direction: 'enter' },
        { direction: 'enter' },
      ];

    try {
      await util.calculateBusyTime(ENTRIES);
      assert.fail("should throw Error but did not :-("); // should not reach this...
    } catch (err) {
      expect(err).to.be.an('error');
      expect(err.message).to.equal('Die Reihenfolge der Kommen/Gehen-Einträge scheint nicht zu stimmen.');
    }

  });
  it('pause should be the same as global_util.DEFAULT_BREAK_TIME_SECONDS', async () => {
    try {
      const result = await util.calculateBusyTime(TWO_ENTRIES);
      expect(result).to.have.property('duration');
      expect(result).to.have.property('busytime');
      expect(result).to.have.property('pause');
      expect(result).to.have.property('count');
    } catch (error) {
      throw error;
    }
  });
  it('should not be rejected if the second entry is a go', async () => {
    try {
      await util.calculateBusyTime(TWO_ENTRIES)
    } catch (error) {
      assert.fail('should not throw an exception!');
    }
  });
})

describe('test find one TimeEntry by its id:  -> util.findById() ', () => {
  it('should find one Time Entry by its id', async () => {
    try {
      const timeentry = await util.findById('5a2100cf87f1f368d087696a');
      // console.log(timeentry)
      expect(timeentry).to.have.property('_id');
      expect(timeentry).to.have.property('direction');
      expect(timeentry).to.have.property('longitude');
      expect(timeentry).to.have.property('latitude');
      expect(timeentry).to.have.property('__v');
      expect(timeentry).to.have.property('direction');
      expect(timeentry.direction).to.equal('enter');
      expect(timeentry).to.have.property('last_changed');
      expect(timeentry).to.have.property('entry_date');
    } catch (error) {
      throw error;
    }
  });
  it('should not find a Time Entry by an invalid id', async () => {
    await expect(util.findById('********_invalid-id_********')).to.be.rejectedWith(Error);
  });
});

describe('test to load the last TimeEntry of a given date: -> util.getLastTimeEntryByDate(dt) ', () => {
  it('check the last entry of a given date', async () => {
    const MY_DATE = moment('2018-01-12');
    try {
      const timeEntry = await util.getLastTimeEntryByDate(MY_DATE);
      // console.log(timeEntry)
      expect(timeEntry).to.not.be.null;
      expect(timeEntry).to.not.be.undefined;
      expect(timeEntry).to.have.property('entry_date');
      expect(moment(timeEntry.entry_date).format('YYYY-MM-DD')).to.equal('2018-01-12');
      expect(moment(timeEntry.entry_date).format('mm:ss')).to.equal('22:56');
    } catch (error) {
      throw error;
    }
  });

  it('last entry of an empty date (in the future) must be undefined', async () => {
    const MY_DATE = moment('2050-01-01');
    try {
      const timeEntry = await util.getLastTimeEntryByDate(MY_DATE);
      // console.log(timeEntry)
      expect(timeEntry).to.be.undefined;
    } catch (error) {
      throw error;
    }
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
      // console.log(timeEntry)
      expect(timeEntry).to.not.be.undefined;
      expect(timeEntry).to.have.property('_id');
      expect(timeEntry._id).to.not.be.empty;
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
    await expect(util.create('go', DEFAULT_DATE)).to.be.rejectedWith(Error);
  });

  it('create not successfully: enter one entry with direction "enter" and then another one also with direction "enter"', async () => {
    try {
      const timeEntry = await util.create({ direction: 'enter', datetime: DEFAULT_DATE });
      await util.create({ direction: 'enter', datetime: DEFAULT_DATE });
      assert.fail("should throw Error but did not :-("); // should not reach this...
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
      expect(timeEntry._id).to.not.be.empty;
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
      // 1. create a TimeEntry with direction enter
      let timeEntry = await create({ direction: 'enter', datetime: DEFAULT_DATE });
      expect(timeEntry).to.not.be.undefined;
      expect(timeEntry).to.have.property('_id');
      expect(timeEntry._id).to.not.be.empty;
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
      expect(timeEntry._id).to.not.be.empty;
      expect(timeEntry._id).to.not.be.a('string');
      expect(timeEntry).to.have.property('__v');
      expect(timeEntry).to.have.property('last_changed');
      expect(timeEntry).to.have.property('entry_date');
      expect(timeEntry).to.have.property('direction');
      expect(timeEntry.direction).to.equal('go');
      expect(moment(timeEntry.entry_date).format('YYYY-MM-DD')).to.equal('1967-03-16');
      expect(timeEntry).to.have.property('longitude');

      // 3. find TimeEntry by id
      timeEntry = await util.findById(timeEntry.id);
      expect(timeEntry).to.not.be.undefined;
      expect(timeEntry).to.have.property('_id');
      expect(timeEntry._id).to.not.be.empty;
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
      assert.fail("should throw Error but did not :-("); // should not reach this...
    } catch (err) {
      expect(err).to.be.an('error');
      expect(err.message).to.equal('to update a record, the passed object must not be undefined');
    }
  });

  after(() => {
    clearAllEntries(DEFAULT_DATE);
  });
});

describe('test util.storeValidationErrors ', () => {
  it('evaluate', async () => {
    const firstTime = { age: moment('2018-01-13T06:30:00.000Z') };
    const lastTime = { age: moment('2018-12-15T14:09:49.314Z') };
    try {
      const result = await util.evaluate(firstTime, lastTime);
      expect(result).to.have.property('message');
      expect(result.message).to.equal('calculation ongoing in background');
    } catch (error) {
      throw error;
    }
  });

  it('storeValidationErrors', async () => {
    const firstTime = { age: moment('2018-01-13T06:30:00.000Z') };
    const lastTime = { age: moment('2018-12-15T14:09:49.314Z') };

    try {
      const result = await util.storeValidationErrors(firstTime, lastTime)
      expect(result).to.have.property('message');
      expect(result.message).to.equal('calculation ongoing in background');
    } catch (error) {
      throw error;
    }
  });

  it('getErrorDates', () => {
    expect(util.getErrorDates()).to.eventually.be.an('array');
  });

  after(() => {
    clearAllEntries(DEFAULT_DATE);
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
      .then(timeEntry => resolve(timeEntry))
      .catch(err => reject(err));
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
  };
}

