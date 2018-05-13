require('../db/db');
const fs = require('fs');
const mongoose = require('mongoose');
const TimeEntry = mongoose.model('TimeEntry');
const StatsDay = mongoose.model('StatsDay');
const util = require('../routes/stats/util-stats');
const utilTimeEntry = require('../routes/entries/util-entries');
const utilTimebox = require('../routes/stats/util-statstimebox');
const utilHistogram = require('../routes/stats/util-histogram');

const chai = require('chai');

const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);

const expect = chai.expect;
const assert = chai.assert;
const should = chai.should;

const moment = require('moment');
require('moment-timezone');
const DEFAULT_DATE = moment('1967-03-16');

/** ************************************************************ */
/** ************************************************************ */

describe('test utilTimeEntry.getFirstTimeEntry/getLastTimeEntry - Promise', () => {
  let db;
  before(() => {
    db = require('../db/db');
  });

  it('getFirstTimeEntry', async () => {
    await utilTimeEntry
      .getFirstTimeEntry()
      .then((result) => {
        expect(result).to.have.property('_id');
        expect(result).to.have.property('age');
      })
      .catch((err) => {
        throw err;
      });
  });

  it('getLastTimeEntry', async () => {
    await utilTimeEntry
      .getLastTimeEntry()
      .then((result) => {
        expect(result).to.have.property('_id');
        expect(result).to.have.property('age');
      })
      .catch((err) => {
        throw err;
      });
  });

  after(() => {
    // db.closeConnection()
  });
});

describe('utilTimeEntry util.removeDoublets - Promise', () => {
  let db;
  before(() => {
    db = require('../db/db');
  });

  it('test for doubletts (should be no in)', async () => {
    await utilTimeEntry
      .removeDoublets()
      .then((result) => {
        // console.log(result)
        expect(result).to.have.property('removed');
        expect(result.removed).to.equal(0);
      })
      .catch((err) => {
        throw err;
      });
  });

  it('add a doublette and check if one has been removed', async () => {
    await createTimeEntry({ direction: 'go', datetime: DEFAULT_DATE })
      .then(result => createTimeEntry({ direction: 'go', datetime: DEFAULT_DATE }))
      .then(result => utilTimeEntry.removeDoublets())
      .then((result) => {
        expect(result).to.have.property('removed');
        expect(result.removed).to.equal(0);
      })
      .catch((err) => {
        throw err;
      });
  });

  after(() => {
    clearAllEntries(DEFAULT_DATE);
    setTimeout(() => {
      // db.closeConnection();
    }, 1000);
  });
});

describe('test util.getStats and getStatsByRange - Promise', () => {
  let db;
  before(() => {
    db = require('../db/db');
  });

  it('getStatsByRange', async () => {
    const dtStart = moment.unix(1391295600000 / 1000);
    const dtEnd = moment(dtStart).add('months', '1');

    await util.getStatsByRange(dtStart, dtEnd)
      .then((result) => {
        // console.log(result)
        expect(result).to.have.property('planned_working_time');
        expect(result).to.have.property('average_working_time');
        expect(result).to.have.property('actual_working_time');
        expect(result).to.have.property('inner_data');
        expect(result.inner_data).to.be.an('array').with.length.greaterThan(0);
        expect(result.inner_data[0]).to.have.property('x');
        expect(result.inner_data[0]).to.have.property('y');
        expect(result).to.have.property('inner_comp');
        expect(result.inner_comp).to.be.an('array').with.length.greaterThan(0);
        expect(result.inner_comp[0]).to.have.property('x');
        expect(result.inner_comp[0]).to.have.property('y');
      })
      .catch((err) => { throw err; });
  });

  it('getStats', async () => {
    await util.getStats('year', 1391295600000)
      .then((result) => {
        // console.log(result)
        expect(result).to.have.property('planned_working_time');
        expect(result).to.have.property('average_working_time');
        expect(result).to.have.property('actual_working_time');
        expect(result).to.have.property('chart_data');
        expect(result.chart_data).to.have.property('xScale');
        expect(result.chart_data).to.have.property('yScale');
        expect(result.chart_data).to.have.property('type');
        expect(result.chart_data).to.have.property('main');
        expect(result.chart_data.main).to.be.an('array').with.length.greaterThan(0);
        expect(result.chart_data.main[0]).to.have.property('data');
        expect(result.chart_data.main[0].data).to.be.an('array').with.length.greaterThan(0);
        expect(result.chart_data.main[0].data[0]).to.have.property('x');
        expect(result.chart_data.main[0].data[0]).to.have.property('y');
        expect(result.chart_data).to.have.property('comp');
        expect(result.chart_data.comp).to.be.an('array').with.length.greaterThan(0);
        expect(result.chart_data.comp[0]).to.have.property('data');
        expect(result.chart_data.comp[0].data).to.be.an('array').with.length.greaterThan(0);
        expect(result.chart_data.comp[0].data[0]).to.have.property('x');
        expect(result.chart_data.comp[0].data[0]).to.have.property('y');
      })
      .catch((err) => { throw err; });
  });

  after(() => {
    // db.closeConnection()
  });
});

describe('test utilHistogram.getHistogramByTimeUnit - Promise', () => {
  let db;
  before(() => {
    db = require('../db/db');
  });

  it('utilHistogram with interval 240', async () => {
    await utilHistogram.getHistogramByTimeUnit(240)
      .then((result) => {
        //console.log(result)
        expect(result).to.be.an('array').with.length.greaterThan(0);
        expect(result).to.be.an('array').with.lengthOf(6) //1440 / 240
        expect(result[0]).to.have.property('time');
        expect(result[0]).to.have.property('histValue');
      })
      .catch((err) => { throw err; });
  });
  it('utilHistogram with interval 1', async () => {
    await utilHistogram.getHistogramByTimeUnit(1) 
      .then((result) => {
        //console.log(result)
        expect(result).to.be.an('array').with.length.greaterThan(0);
        expect(result).to.be.an('array').with.lengthOf(1440) // numbers of minutes in one day
        expect(result[0]).to.have.property('time');
        expect(result[0]).to.have.property('histValue');
      })
      .catch((err) => { throw err; });
  });
  it('utilHistogram with interval 1440', async () => {
    await utilHistogram.getHistogramByTimeUnit(1440)  // numbers of minutes in one day
      .then((result) => {
        //console.log(result)
        expect(result).to.be.an('array').with.length.greaterThan(0);
        expect(result).to.be.an('array').with.lengthOf(1)
        expect(result[0]).to.have.property('time');
        expect(result[0]).to.have.property('histValue');
      })
      .catch((err) => { throw err; });
  });
  it('should throw exception when passing an invertval less 1', () => {
    return expect(utilHistogram.getHistogramByTimeUnit(0)).to.be.rejected
  });
  it('utilHistogram with interval 60 with go', async () => {
    await utilHistogram.getHistogramByTimeUnit(60, 'go')  // numbers of minutes in one day
      .then((result) => {
        //console.log(result)
        expect(result).to.be.an('array').with.length.greaterThan(0);
        expect(result).to.be.an('array').with.lengthOf(24)
        expect(result[0]).to.have.property('time');
        expect(result[0]).to.have.property('histValue');
      })
      .catch((err) => { throw err; });
  });
  it('utilHistogram with interval 60 with enter', async () => {
    await utilHistogram.getHistogramByTimeUnit(60, 'enter')  // numbers of minutes in one day
      .then((result) => {
        //console.log(result)
        expect(result).to.be.an('array').with.length.greaterThan(0);
        expect(result).to.be.an('array').with.lengthOf(24)
        expect(result[0]).to.have.property('time');
        expect(result[0]).to.have.property('histValue');
      })
      .catch((err) => { throw err; });
  });
  it('utilHistogram with interval 60 with invalid direction', async () => {
    await utilHistogram.getHistogramByTimeUnit(60, 'XXXX')  // numbers of minutes in one day
      .then((result) => {
        //console.log(result)
        expect(result).to.be.an('array').with.length.greaterThan(0);
        expect(result).to.be.an('array').with.lengthOf(24)
        expect(result[0]).to.have.property('time');
        expect(result[0]).to.have.property('histValue');
        expect(result[0].histValue).to.equal(0);
        expect(result[result.length - 1].histValue).to.equal(0);
      })
      .catch((err) => { throw err; });
  });

  after(() => {
    // db.closeConnection()
  });
});
/*
describe("test util.deleteAllStatsDays - Promise", () => {
  var db;
  before(function() {
    db = require("../db/db");
  });

  it("load StatsDays", async () => {
    await StatsDay.find()
    .then(statsDays => {
      expect(statsDays).to.have.length > 0;
      return statsDays;
    })
    .then(result => util.deleteAllStatsDays())
    .then(result => {
      //console.log(result)
      expect(result).to.have.property("size");
      expect(result.size).to.equal(0);
    })
    .then(StatsDay.find())
    .then(statsDays => {
      expect(statsDays).to.be.undefined;
    })
    .catch(err => { throw err; });
  });

  after(function() {
    //db.closeConnection()
  });
});
*/
// ========================================================================================================
/**
 * create a new TimeEntry regardless other entries. No checks will be performed
 */
function createTimeEntry(timeEntry) {
  // console.log('entered save ' + id)
  return new Promise((resolve, reject) => {
    new TimeEntry({
      entry_date: timeEntry.datetime,
      direction: timeEntry.direction,
      longitude: timeEntry.longitude,
      latitude: timeEntry.latitude,
      signature: 'HARD_CODED',
    })
      .save()
      .then(timeEntry => resolve(timeEntry))
      .catch(err => reject(err));
  });
}

/**
 *
 * @param {*} date date to delete all entries which might have stayed because of any error
 */
function clearAllEntries(dt) {
  utilTimeEntry.getAllByDate(dt).then((timeentries) => {
    console.log(`removing ${timeentries.length} entries`);
    timeentries.forEach((timeentry) => {
      utilTimeEntry.deleteById(timeentry._id);
    });
  });
}
// ========================================================================================================
