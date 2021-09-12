require('../db');
const mongoose = require('mongoose');

const TimeEntry = mongoose.model('TimeEntry');
const util = require('../api/stats/util-stats');
const utilTimeEntry = require('../api/entries/util-entries');
const utilTimebox = require('../api/stats/util-statstimebox');
const utilHistogram = require('../api/stats/util-histogram');

const chai = require('chai');

const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const expect = chai.expect;

const moment = require('moment');
require('moment-timezone');

const DEFAULT_DATE = moment('1967-03-16');

/** ************************************************************ */

describe('test utilTimeEntry.getFirstTimeEntry/getLastTimeEntry', () => {
  it('getFirstTimeEntry', () => {
    utilTimeEntry
      .getFirstTimeEntry()
      .then((result) => {
        expect(result).to.have.property('_id');
        expect(result).to.have.property('age');
      })
      .catch((err) => {
        throw err;
      });
  });

  it('getLastTimeEntry', () => {
    utilTimeEntry
      .getLastTimeEntry()
      .then((result) => {
        expect(result).to.have.property('_id');
        expect(result).to.have.property('age');
      })
      .catch((err) => {
        throw err;
      });
  });
});

describe('utilTimeEntry util.removeDoublets', () => {
  it('test for doubletts (should be no in)', () => {
    utilTimeEntry
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

  it('add a doublette and check if one has been removed', () => {
    createTimeEntry({ direction: 'go', datetime: DEFAULT_DATE })
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
  });
});

describe('test util.getStats and getStatsByRange', () => {
  it('getStatsByRange', () => {
    const dtStart = moment.unix(1391295600000 / 1000);
    const dtEnd = moment(dtStart).add(1, 'months');

    util.getStatsByRange(dtStart, dtEnd)
      .then((result) => {
        //console.log(result)
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

  it('getStats', () => {
    util.getStats('year', 1391295600000)
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
});

describe('test utilHistogram.getHistogramByTimeUnit', () => {
  it('utilHistogram with interval 240', () => {
    utilHistogram.getHistogramByTimeUnit(240)
      .then((result) => {
        // console.log(result)
        expect(result).to.be.an('array').with.length.greaterThan(0);
        expect(result).to.be.an('array').with.lengthOf(6); // 1440 / 240
        expect(result[0]).to.have.property('time');
        expect(result[0]).to.have.property('histValue');
      })
      .catch((err) => { throw err; });
  });
  it('utilHistogram with interval 1', () => {
    utilHistogram.getHistogramByTimeUnit(1)
      .then((result) => {
        // console.log(result)
        expect(result).to.be.an('array').with.length.greaterThan(0);
        expect(result).to.be.an('array').with.lengthOf(1440); // numbers of minutes in one day
        expect(result[0]).to.have.property('time');
        expect(result[0]).to.have.property('histValue');
      })
      .catch((err) => { throw err; });
  });
  it('utilHistogram with interval 1440', () => {
    utilHistogram.getHistogramByTimeUnit(1440) // numbers of minutes in one day
      .then((result) => {
        // console.log(result)
        expect(result).to.be.an('array').with.length.greaterThan(0);
        expect(result).to.be.an('array').with.lengthOf(1);
        expect(result[0]).to.have.property('time');
        expect(result[0]).to.have.property('histValue');
      })
      .catch((err) => { throw err; });
  });
  it('should throw exception when passing an invertval less 1', () => expect(utilHistogram.getHistogramByTimeUnit(0)).to.be.rejected);
  it('utilHistogram with interval 60 with go', () => {
    utilHistogram.getHistogramByTimeUnit(60, 'go') // numbers of minutes in one day
      .then((result) => {
        // console.log(result)
        expect(result).to.be.an('array').with.length.greaterThan(0);
        expect(result).to.be.an('array').with.lengthOf(24);
        expect(result[0]).to.have.property('time');
        expect(result[0]).to.have.property('histValue');
      })
      .catch((err) => { throw err; });
  });
  it('utilHistogram with interval 60 with enter', () => {
    utilHistogram.getHistogramByTimeUnit(60, 'enter') // numbers of minutes in one day
      .then((result) => {
        // console.log(result)
        expect(result).to.be.an('array').with.length.greaterThan(0);
        expect(result).to.be.an('array').with.lengthOf(24);
        expect(result[0]).to.have.property('time');
        expect(result[0]).to.have.property('histValue');
      })
      .catch((err) => { throw err; });
  });
  it('utilHistogram with interval 60 with invalid direction', () => {
    utilHistogram.getHistogramByTimeUnit(60, 'XXXX') // numbers of minutes in one day
      .then((result) => {
        // console.log(result)
        expect(result).to.be.an('array').with.length.greaterThan(0);
        expect(result).to.be.an('array').with.lengthOf(24);
        expect(result[0]).to.have.property('time');
        expect(result[0]).to.have.property('histValue');
        expect(result[0].histValue).to.equal(0);
        expect(result[result.length - 1].histValue).to.equal(0);
      })
      .catch((err) => { throw err; });
  });
});

describe('test utilTimebox.getStatsByTimeBox', () => {
  it('getStatsByTimeBox with year', () => {
    utilTimebox.getStatsByTimeBox('year')
      .then((result) => { checkTimeboxResult(result); })
      .catch((err) => { throw err; });
  });
  it('getStatsByTimeBox with month', () => {
    utilTimebox.getStatsByTimeBox('month')
      .then((result) => { checkTimeboxResult(result); })
      .catch((err) => { throw err; });
  });
  it('getStatsByTimeBox with week', () => {
    utilTimebox.getStatsByTimeBox('week')
      .then((result) => { checkTimeboxResult(result); })
      .catch((err) => { throw err; });
  });
  it('getStatsByTimeBox with day', () => {
    utilTimebox.getStatsByTimeBox('day')
      .then((result) => { checkTimeboxResult(result); })
      .catch((err) => { throw err; });
  });
  it('getStatsByTimeBox with weekday', () => {
    utilTimebox.getStatsByTimeBox('weekday')
      .then((result) => { checkTimeboxResult(result); })
      .catch((err) => { throw err; });
  });
  it('should throw exception when passing an invalid timeUnit', () => expect(utilTimebox.getStatsByTimeBox('XXXX')).to.be.rejected);
});


/*
describe("test util.deleteAllStatsDays", () => {
  var db;
  before(function() {
    db = require("../db");
  });

  it("load StatsDays", () => {
    StatsDay.find()
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
    // console.log(`removing ${timeentries.length} entries`);
    timeentries.forEach((timeentry) => {
      utilTimeEntry.deleteById(timeentry._id);
    });
  });
}

function checkTimeboxResult(result) {
  expect(result).to.have.property('planned_working_time');
  expect(result).to.have.property('average_working_time');
  expect(result).to.have.property('actual_working_time');
  expect(result).to.have.property('inner_data');
  expect(result.inner_data).to.be.an('array').with.length.greaterThan(0);
  expect(result.inner_data[0]).to.have.property('x');
  expect(result.inner_data[0]).to.have.property('y');
  expect(result).to.have.property('inner_comp');
  expect(result.inner_comp).to.be.empty;
}
// ========================================================================================================
