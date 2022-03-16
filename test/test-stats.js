require('./init');
require('../db');
const mongoose = require('mongoose');

const TimeEntry = mongoose.model('TimeEntry');
const StatsDay = mongoose.model('StatsDay');
const util = require('../api/stats/util-stats');
const utilTimeEntry = require('../api/entries/util-entries');
const utilTimebox = require('../api/stats/util-statstimebox');
const utilHistogram = require('../api/stats/util-histogram');

const chai = require('chai');

const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const expect = chai.expect;

const moment = require('moment');
const { assert } = require('chai');
require('moment-timezone');

const DEFAULT_DATE = moment('1967-03-16');

/** ************************************************************ */

describe('test utilTimeEntry.getFirstTimeEntry/getLastTimeEntry', () => {
  it('getFirstTimeEntry', async () => {
    result = await utilTimeEntry.getFirstTimeEntry();
    expect(result).to.have.property('_id');
    expect(result).to.have.property('age');
  });

  it('getLastTimeEntry', async () => {
    result = await utilTimeEntry.getLastTimeEntry();
    expect(result).to.have.property('_id');
    expect(result).to.have.property('age');
  });
});

describe('utilTimeEntry util.removeDoublets', () => {
  it('test for doubletts (should be no in)', async () => {
    const result = await utilTimeEntry.removeDoublets();
    expect(result).to.have.property('removed');
    expect(result.removed).to.equal(0);
  });

  it('add a doublette and check if one has been removed', async () => {
    await createTimeEntry({ direction: 'go', datetime: DEFAULT_DATE });
    await createTimeEntry({ direction: 'go', datetime: DEFAULT_DATE });

    const r = await TimeEntry.find({ entry_date: DEFAULT_DATE });
    expect(r).to.have.length(2);

    const result = await utilTimeEntry.removeDoublets();
    expect(result).to.have.property('removed');
    expect(result.removed).to.equal(1);
  });

  after(async () => {
    await clearAllEntries(DEFAULT_DATE);
  });
});

describe('test util.getStats and getStatsByRange', () => {
  it('getStatsByRange', async () => {
    const dtStart = moment.unix(1638206460000 / 1000);
    const dtEnd = moment(dtStart).add(1, 'months');

    const result = await util.getStatsByRange(dtStart, dtEnd);
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
  });

  it('getStatsByRange with fill=true', async () => {
    const dtStart = moment.unix(1638206460000 / 1000);
    const dtEnd = moment(dtStart).add(1, 'months');

    const result = await util.getStatsByRange(dtStart, dtEnd, 'false', 'true');
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
  });

  it('getStatsByRange with accumulate=true', async () => {
    const dtStart = moment.unix(1638206460000 / 1000);
    const dtEnd = moment(dtStart).add(1, 'months');

    const result = await util.getStatsByRange(dtStart, dtEnd, 'true', 'false');
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
  });

  it('getStats (year)', async () => {
    const result = await util.getStats('year', 1638206460000);
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
  });
  it('getStats (month)', async () => {
    const result = await util.getStats('month', 1638206460000);
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
  });
  it('getStats (week)', async () => {
    const result = await util.getStats('week', 1638206460000);
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
  });
  it('getStats (day)', async () => {
    const result = await util.getStats('day', 1491295600000);
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
  });
});

describe('test utilHistogram.getHistogramByTimeUnit', () => {
  it('utilHistogram with interval 240', async () => {
    const result = await utilHistogram.getHistogramByTimeUnit(240);
    expect(result).to.be.an('array').with.length.greaterThan(0);
    expect(result).to.be.an('array').with.lengthOf(6); // 1440 / 240
    expect(result[0]).to.have.property('time');
    expect(result[0]).to.have.property('histValue');
  });
  it('utilHistogram with interval 1', async () => {
    const result = await utilHistogram.getHistogramByTimeUnit(1);
    expect(result).to.be.an('array').with.length.greaterThan(0);
    expect(result).to.be.an('array').with.lengthOf(1440); // numbers of minutes in one day
    expect(result[0]).to.have.property('time');
    expect(result[0]).to.have.property('histValue');
  });
  it('utilHistogram with interval 1440', async () => {
    const result = await utilHistogram.getHistogramByTimeUnit(1440); // numbers of minutes in one day
    expect(result).to.be.an('array').with.length.greaterThan(0);
    expect(result).to.be.an('array').with.lengthOf(1);
    expect(result[0]).to.have.property('time');
    expect(result[0]).to.have.property('histValue');
  });
  it('should throw exception when passing an interval less 1', async () => {
    try {
      await utilHistogram.getHistogramByTimeUnit(0);
      assert.fail('should not reach this point but throw error instead');
    } catch (error) {
      expect(error.message).to.be.equal('interval must not be less 1');
    }
  });
  it('utilHistogram with interval 60 with go', async () => {
    const result = await utilHistogram.getHistogramByTimeUnit(60, 'go') // numbers of minutes in one day
    expect(result).to.be.an('array').with.length.greaterThan(0);
    expect(result).to.be.an('array').with.lengthOf(24);
    expect(result[0]).to.have.property('time');
    expect(result[0]).to.have.property('histValue');
  });
  it('utilHistogram with interval 60 with enter', async () => {
    const result = await utilHistogram.getHistogramByTimeUnit(60, 'enter') // numbers of minutes in one day
    expect(result).to.be.an('array').with.length.greaterThan(0);
    expect(result).to.be.an('array').with.lengthOf(24);
    expect(result[0]).to.have.property('time');
    expect(result[0]).to.have.property('histValue');
  });
  it('utilHistogram with interval 60 with invalid direction', async () => {
    const result = await utilHistogram.getHistogramByTimeUnit(60, 'XXXX') // numbers of minutes in one day
    expect(result).to.be.an('array').with.length.greaterThan(0);
    expect(result).to.be.an('array').with.lengthOf(24);
    expect(result[0]).to.have.property('time');
    expect(result[0]).to.have.property('histValue');
    expect(result[0].histValue).to.equal(0);
    expect(result[result.length - 1].histValue).to.equal(0);
  });
});

describe('test utilTimebox.getStatsByTimeBox', () => {
  it('getStatsByTimeBox with year', async () => {
    const result = await utilTimebox.getStatsByTimeBox('year');
    checkTimeboxResult(result);
  });
  it('getStatsByTimeBox with month', async () => {
    const result = await utilTimebox.getStatsByTimeBox('month');
    checkTimeboxResult(result);
  });
  it('getStatsByTimeBox with week', async () => {
    const result = await utilTimebox.getStatsByTimeBox('week');
    checkTimeboxResult(result);
  });
  it('getStatsByTimeBox with day', async () => {
    const result = await utilTimebox.getStatsByTimeBox('day');
    checkTimeboxResult(result);
  });
  it('getStatsByTimeBox with weekday', async () => {
    const result = await utilTimebox.getStatsByTimeBox('weekday');
    checkTimeboxResult(result);
  });
  it('should throw exception when passing an invalid timeUnit', async () => {
    try {
      await utilTimebox.getStatsByTimeBox('XXXX');
      assert.fail('should not reach this point but throw error instead');
    } catch (error) {
      expect(error.message).to.be.equal("time unit 'XXXX' is invalid");
    }

  });
});
describe("test util.calculateStatistics", () => {
  var db;
  before(function () {
    db = require("../db");
  });

  it('calcStats', async () => {
    const firstEntry = { _id: 0, age: moment('2016-01-01T06:30:00.000Z') };
    const lastEntry = { _id: 0, age: moment('2016-01-15T06:30:00.000Z') };

    const result = await util.calculateStatistics(firstEntry, lastEntry);

    expect(result).to.have.property('firstEntry');
    expect(result.firstEntry).to.have.property('_id');
    expect(result.firstEntry).to.have.property('age');

    expect(result).to.have.property('lastEntry');
    expect(result.lastEntry).to.have.property('_id');
    expect(result.lastEntry).to.have.property('age');
  });

  after(function () {
    //db.closeConnection()
  });
});

/*
describe("test util.deleteAllStatsDays", () => {
  var db;
  before(function () {
    db = require("../db");
  });

  it.only("load StatsDays", async () => {
    let statsDays = await StatsDay.find();
    expect(statsDays).to.have.length > 0;
    const result = await util.deleteAllStatsDays();
    expect(result).to.have.property("size");
    expect(result.size).to.equal(0);
    statsDays = StatsDay.find();
    expect(statsDays).to.be.undefined;
  });

  after(function () {
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
async function clearAllEntries(dt) {
  const timeentries = await utilTimeEntry.getAllByDate(dt);
  for (const timeentry of timeentries) {
    await utilTimeEntry.deleteById(timeentry._id);
  }
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
  expect(result.inner_comp).to.not.be.empty;
}
// ========================================================================================================
