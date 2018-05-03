require('../db/db');
const mongoose = require('mongoose');
const TimeEntry = mongoose.model('TimeEntry');
const util = require('../routes/entries/util-entries');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

const expect = chai.expect;
const assert = chai.assert;
const should = chai.should;

const moment = require('moment');
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

describe('isEmpty - Promise', () => {
  let testv;
  it('should return false when the value is a string', () => {
    testv = util.isEmpty('Test');
    expect(testv).to.be.false;
  });
  it('should return true when the value is a numeric value', () => {
    testv = util.isEmpty(123);
    expect(testv).to.be.true;
  });
  it('should return true when the value is a boolean value', () => {
    testv = util.isEmpty(true);
    expect(testv).to.be.true;
    testv = util.isEmpty(false);
    expect(testv).to.be.true;
  });
  it('should return true when the value is emtpy value', () => {
    testv = util.isEmpty();
    expect(testv).to.be.true;
  });
  it('should return true when the value is undefined value', () => {
    testv = util.isEmpty(undefined);
    expect(testv).to.be.true;
  });
  it('should return false when the value is an array', () => {
    testv = util.isEmpty(['a', 'b']);
    expect(testv).to.be.false;
  });
});

describe('test stripdownToDateBerlin method', () => {
  it('should remove time component', () => util.stripdownToDateBerlin(1393455600031).format('HH:mm:ss').should.equal('00:00:00'));
  it('should have date component', () => util.stripdownToDateBerlin(1000000000000).format('YYYY-MM-DD').should.equal('2001-09-09'));
  it('should have date Europe/Berlin timezone', () => util.stripdownToDateBerlin(1000000000000)._z.name.should.equal('Europe/Berlin'));
  it('should parse timestamp 0', () => util.stripdownToDateBerlin(0).format('YYYY-MM-DD HH:mm:ss').should.equal('1970-01-01 00:00:00'));
  it('should parse negative timestamp to timestamp 0', () => util.stripdownToDateBerlin(-999).format('YYYY-MM-DD HH:mm:ss').should.equal('1970-01-01 00:00:00'));
});

// assert('foo' !== 'bar', 'foo is not bar')
// assert(Array.isArray([]), 'empty arrays are arrays')
describe('test util.getAllByDate - Promise', () => {
  let db;
  before(() => {
    db = require('../db/db');
  });

  it('response array should have length of 0', () => util.getAllByDate(-1).should.eventually.have.length(0));
  it('response array should have length of 2', () => util.getAllByDate(1393455600000).should.eventually.have.length(2));
  it('response array should have length of 0', () => util.getAllByDate(1000000000000).should.eventually.have.length(0));
  it('response array should have length of 0', () => util.getAllByDate(0).should.eventually.have.length(0));

  after(() => {
    // db.closeConnection()
  });
});

describe('test util.getBusyTime - Promise', () => {
  let db;
  before(() => {
    db = require('../db/db');
  });

  it('should not have any entries', async () => {
    await util.getBusyTime({}).should.be.rejected;
  });

  it('should be rejected if only one entry', async () => {
    await util.getBusyTime(ONE_ENTRY).should.be.rejected;
  });

  it('should be rejected if the second entry is not a go', async () => {
    const ENTRIES =
    [
      { direction: 'enter' },
      { direction: 'enter' },
    ];

    await util.getBusyTime(ENTRIES).should.be.rejected;
  });
  it('should not be rejected if the second entry is a go', async () => {
    await util.getBusyTime(TWO_ENTRIES).should.not.be.rejected;
  });

  after(() => {
    // db.closeConnection()
  });
});

describe('test find one TimeEntry by its id:  -> util.findById() - Promise', () => {
  let db;
  before(() => {
    db = require('../db/db');
  });

  it('should find one Time Entry by its id', async () => {
    // util.findById('5a2100cf87f1f368d087696a').then(timeentry => console.log(timeentry))
    await util.findById('5a2100cf87f1f368d087696a')
      .then((timeentry) => {
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
      })
      .catch((err) => { throw err; });
  });
  it('should not find a Time Entry by an invalid id', () => util.findById('********_invalid-id_********').should.be.rejectedWith(Error));

  after(() => {
    // db.closeConnection()
  });
});

describe('test to load the last TimeEntry of a given date:  -> util.getLastTimeEntryByDate(dt) - Promise', () => {
  let db;
  before(() => {
    db = require('../db/db');
  });

  it('check the last entry of a given date', async () => {
    const MY_DATE = moment('2018-01-12');

    await util.getLastTimeEntryByDate(MY_DATE)
      .then((timeEntry) => {
        // console.log(timeEntry)
        expect(timeEntry).to.not.be.null;
        expect(timeEntry).to.not.be.undefined;
        expect(timeEntry).to.have.property('entry_date');
        expect(moment(timeEntry.entry_date).format('YYYY-MM-DD')).to.equal('2018-01-12');
        expect(moment(timeEntry.entry_date).format('mm:ss')).to.equal('22:56');
        // should actually be
        // expect(moment(timeEntry.entry_date).format('HH:mm:ss')).to.equal('17:22:56')
        // but timezone trouble on travis makes it difficult...
      })
      .catch((err) => {
        console.log(`no error should occure; instead: ${err.message}`);
        throw err;
      });
  });

  it('last entry of an empty date (in the future) must be undefined', async () => {
    const MY_DATE = moment('2050-01-01');

    await util.getLastTimeEntryByDate(MY_DATE)
      .then((timeEntry) => {
        // console.log(timeEntry)
        expect(timeEntry).to.be.undefined;
      })
      .catch((err) => {
        console.log(`no error should occure; instead: ${err.message}`);
        throw err;
      });
  });
});

describe('test to create one TimeEntry:  -> util.create() - Promise', () => {
  let db;
  before(() => {
    db = require('../db/db');
  });

  it('create successfully a new TimeEntry', async () => {
    await util.create({ direction: 'enter', datetime: DEFAULT_DATE })
      .then((timeEntry) => {
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

        return timeEntry._id;
      })
      .then(util.findById)
      .then((timeEntry) => {
        expect(timeEntry).to.not.be.null;

        return timeEntry._id;
      })
      .then(util.deleteById) // delete entry and prove so
      .then(timeEntry => timeEntry._id)
      .then(util.findById)
      .then((timeEntry) => {
        expect(timeEntry).to.be.null;
      })
      .catch((err) => {
        console.log(`no error should occure; instead: ${err.message}`);
        clearAllEntries(DEFAULT_DATE);
        throw err;
      });
  });

  it('create not successfully a new TimeEntry: first entry must not have direction "go"', async () => expect(util.create('go', DEFAULT_DATE)).to.be.rejected);

  it('create not successfully: enter one entry with "enter" and then another one also with "enter"', async () => {
    await util.create({ direction: 'enter', datetime: DEFAULT_DATE })
      .then(timeEntry => timeEntry._id)
      .then(expect(util.create('go', DEFAULT_DATE)).to.be.rejected)
      .then(clearAllEntries(DEFAULT_DATE))
      .catch((err) => {
        clearAllEntries(DEFAULT_DATE);
        throw err;
      });
  });

  it('create successfully a new TimeEntry without datetime', async () => {
    await util.create({ direction: 'enter' })
      .then((timeEntry) => {
        // console.log(timeEntry)
        expect(timeEntry).to.not.be.undefined;
        expect(timeEntry).to.have.property('_id');
        expect(timeEntry._id).to.not.be.empty;
        expect(timeEntry._id).to.not.be.a('string');
        expect(timeEntry).to.have.property('__v');
        expect(timeEntry).to.have.property('last_changed');
        expect(timeEntry).to.have.property('entry_date');
        expect(moment(timeEntry.entry_date).format('YYYY-MM-DD')).to.equal(moment().format('YYYY-MM-DD'));
        expect(timeEntry).to.have.property('latitude');
        expect(timeEntry).to.have.property('longitude');
        expect(timeEntry).to.have.property('direction');
        expect(timeEntry.direction).to.equal('enter');

        return timeEntry._id;
      })
      .then(util.findById)
      .then((timeEntry) => {
        expect(timeEntry).to.not.be.null;

        return timeEntry._id;
      })
      .then(util.deleteById) // delete entry and prove so
      .then(timeEntry => timeEntry._id)
      .then(util.findById)
      .then((timeEntry) => {
        expect(timeEntry).to.be.null;
      })
      .catch((err) => {
        clearAllEntries(DEFAULT_DATE);
        throw err;
      });
  });
});


describe('test delete one TimeEntry by its id:  -> util.deleteById() - Promise', () => {
  let db;
  before(() => {
    db = require('../db/db');
  });

  it('should delete one Time Entry by its id', async () => {
    // create new entry (which will be deleted later)
    await create({ direction: 'enter', datetime: DEFAULT_DATE })
      .then(timeEntry => timeEntry._id)
      .then(util.deleteById)
      .then(util.findById)
      .then((timeEntry) => {
        expect(timeEntry).to.be.null;
      })
      .catch((err) => {
        clearAllEntries(DEFAULT_DATE);
        throw err;
      });
  });
});

describe('test to modify one TimeEntry:  -> util.update() - Promise', () => {
  let db;
  before(() => {
    db = require('../db/db');
  });

  it('modify successfully a new TimeEntry', async () => {
    await create({ direction: 'enter', datetime: DEFAULT_DATE })
      .then((timeEntry) => {
        //        console.log(timeEntry)
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

        timeEntry.direction = 'go';
        return timeEntry;
      })
      .then(util.update)
      .then((timeEntry) => {
        expect(timeEntry).to.not.be.null;
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
        return timeEntry._id;
      })
      .then(util.findById)
      .then((timeEntry) => {
        // console.log(timeEntry)
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

        return timeEntry._id;
      })
      .then(util.deleteById) // delete entry and prove so
      .then(timeEntry => timeEntry._id)
      .then(util.findById)
      .then((timeEntry) => {
        expect(timeEntry).to.be.null;
      })
      .catch((err) => {
        throw err;
      });
  }),
  it('should throw exception when passing an undefined object', () => {
    (function () {
      util.update();
    }).should.throw(Error);
  });

  after(() => {
    clearAllEntries(DEFAULT_DATE);
    setTimeout(() => {
      db.closeConnection();
    }, 1000);
  });
});

/**
 *
 * @param {*} date date to delete all entries which might have stayed because of any error
 */
function clearAllEntries(dt) {
  util.getAllByDate(dt)
    .then((timeentries) => {
      console.log(`removing ${timeentries.length} entries`);
      timeentries.forEach((timeentry) => {
        util.deleteById(timeentry._id);
      });
    });
}

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