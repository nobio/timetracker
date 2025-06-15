const logger = require('../config/logger'); // Logger configuration
require('../../db');
// const moment = require('moment');
const moment = require('moment-timezone');
const mongoose = require('mongoose');
const g_util = require('../global_util');

const utilEntry = require('../entries/util-entries');

const StatsDay = mongoose.model('StatsDay');

const DEFAULT_WORKING_TIME = 7.8 * 60 * 60 * 1000; // 7.8 hours in milli seconds

let isCalcRunning = false;

/**
 * Orchestrate the calculation of statistics
 */
exports.calcStats = async () => {
  logger.info(`---------------------- calcStats isRunning: ${isCalcRunning} -----------------------------`);
  if (isCalcRunning) return;
  isCalcRunning = true;
  try {
    g_util.sendMessage('RECALCULATE', 'delete stats');
    await StatsDay.deleteMany();

    g_util.sendMessage('RECALCULATE', 'delete doublets');
    await utilEntry.removeDoublets();

    const firstEntry = await utilEntry.getFirstTimeEntry();
    const lastEntry = await utilEntry.getLastTimeEntry();
    g_util.sendMessage('RECALCULATE', `first: ${firstEntry.age}, last: ${lastEntry.age}`);

    g_util.sendMessage('RECALCULATE', 'start calculating...');
    const result = await this.calculateStatistics(firstEntry, lastEntry);
    g_util.sendMessage('RECALCULATE', '...calculation done');

    isCalcRunning = false;
    return result;
  } catch (error) {
    logger.info(error);
    isCalcRunning = false;
    throw error;
  } finally {
    isCalcRunning = false;
  }
};

/**
 * This is the real calculation of statistice. The method searches the first entry point and
 * iterates day by day until the last time entry and calculates for each day the statistics
 *
 * @param {*} firstEntry the first entry in database
 * @param {*} lastEntry  the last entry in database
 */
exports.calculateStatistics = async (firstEntry, lastEntry) => {
  // logger.info(firstEntry, lastEntry);
  let date = utilEntry.stripdownToDateUTC(firstEntry.age);

  while (date <= moment(lastEntry.age)) {
    // logger.info(`calculating for day ${date.format('YYYY-MM-DD')}`);
    const dt = moment(date);
    const busytime = await this.getBusytimeByDate(dt);
    // logger.info(`-> ${dt.toISOString()} ${JSON.stringify(busytime)}`);
    if (busytime && busytime.busytime && busytime.busytime !== 0) {
      new StatsDay({
        date: dt,
        actual_working_time: busytime.busytime / 1,
        planned_working_time: DEFAULT_WORKING_TIME,
        is_working_day: true,
        is_complete: true,
        last_changed: new Date(),
      }).save();
    }
    date = date.add(1, 'day');
    // date, busytime);
  }
  logger.info('calculateStatistics done');
  return { firstEntry, lastEntry };
};

/**
 * Calculates the time of "busyness" for the given day;
 * must start with an 'enter' and must end with a 'go'. If only two entries (enter-go) a default value (midday break)
 * will be added (DEFAULT_BREAK_TIME);
 * if there are enter-go-enter-go(-enter-go....enter-go) entries the time span between two enter and go will be calculated and added.
 *
 * @param {*} dt calculate the busytime for given date
 */
exports.getBusytimeByDate = async (dt) => {
  try {
    const timeEntries = await utilEntry.getAllByDate(dt);
    const calculated = await utilEntry.calculateBusyTime(timeEntries);

    return { busytime: calculated.busytime };
  } catch (error) {
    logger.error(error.message);
    return { busytime: 0 };
  }
};

/**
 * clears the MongoDB collection for statistics
 */
exports.deleteAllStatsDays = () => new Promise((resolve) => {
  let size;
  StatsDay.find((err, statsdays) => {
    size = statsdays.length;
    statsdays.forEach((statsday) => {
      // logger.info('removing ' + statsday);
      statsday.remove();
    });
    logger.info(`deleted ${size} items`);
    resolve({ size });
  });
});

exports.getStats = (timeUnit, startDate, accumulate, fill) => {
  const dtStart = moment.unix(startDate / 1000).tz('Europe/Berlin');

  let dtEnd;

  if (timeUnit === 'year') {
    dtEnd = moment(dtStart).add(1, 'years');
  } else if (timeUnit === 'month') {
    dtEnd = moment(dtStart).add(1, 'months');
  } else if (timeUnit === 'week') {
    dtEnd = moment(dtStart).add(1, 'weeks');
  } else if (timeUnit === 'day') {
    dtEnd = moment(dtStart).add(1, 'days');
  }

  // logger.info("Start at " + dtStart.toDate() + "\nEnd at " + dtEnd.toDate());

  return new Promise((resolve, reject) => {
    this.getStatsByRange(dtStart, dtEnd, accumulate, fill).then((calculatedBusyTime) => {
      // logger.info(`getStatsByRange: ${JSON.stringify(calculatedBusyTime)}`);
      const chart_data = {
        xScale: timeUnit === 'day' ? 'ordinal' : 'time',
        yScale: 'linear',
        type: timeUnit === 'day' ? 'bar' : 'line-dotted',
        main: [
          {
            data: calculatedBusyTime.inner_data,
          },
        ],
        comp: [
          {
            type: 'line',
            data: calculatedBusyTime.inner_comp,
          },
        ],
      };

      resolve({
        actual_working_time: calculatedBusyTime.actual_working_time,
        planned_working_time: calculatedBusyTime.planned_working_time,
        average_working_time: calculatedBusyTime.average_working_time,
        chart_data,
      });
    });
  });
};

/**
 * returns the aggregated statistics for a given time range defined by start and end
 *
 * @param {*} dtStart
 * @param {*} dtEnd
 * @param {*} accumulate
 */
// exports.getBusytimeByDate = async (dt) => {
exports.getStatsByRange = async (dtStart, dtEnd, accumulate, fill) => {
  const innerData = [];
  const innerComp = [];
  let actualWorkingTime = -1;
  let plannedWorkingTime = -1;
  let averageWorkingTime = -1;

  // init arrays innerComp, innerData
  if (fill === 'true') {
    let i = 0;
    const dtStartClone = dtStart.clone();

    for (let m = dtStartClone; m.isBefore(dtEnd); m.add(1, 'days')) { // dtStart and dtEnd have type "moment"
      // logger.info(` >>> ${m} -> ${m.format('YYYY-MM-DD')} / ${dtStart}`);
      innerData[i] = {
        x: m.format('YYYY-MM-DD'),
        y: null,
      };
      innerComp[i] = {
        x: m.format('YYYY-MM-DD'),
        y: 0.0,
      };
      i++;
    }
    // console.table(innerComp)
  }

  const stats = await StatsDay.find({ date: { $gte: dtStart, $lt: dtEnd } }).sort({ date: 1 });

  // calculating actual working time
  stats.forEach((stat) => {
    actualWorkingTime += stat.actual_working_time;
  });
  averageWorkingTime = actualWorkingTime / stats.length / 60 / 60 / 1000;

  // logger.info("average_working_time = " + average_working_time);
  // logger.info("length = " + stats.length);

  let sumActual = 0;
  let sumNominal = 0;
  stats.forEach((stat) => {
    const statDateYMD = moment(stat.date).tz('Europe/Berlin').format('YYYY-MM-DD');
    // logger.info(`${moment(stat.date).format('YYYY-MM-DD')} ${stat.actual_working_time} ${stat.planned_working_time} -> ${stat._id}`);
    let obj;
    plannedWorkingTime += stat.planned_working_time;
    if (accumulate === 'true') {
      (sumActual += Math.round((stat.actual_working_time / 60 / 60 / 1000) * 100) / 100), // rounding 2 digits after comma
        (sumNominal += Math.round(averageWorkingTime * 100) / 100), // rounding 2 digits after comma
        obj = getXYObjectByXValue(innerData, statDateYMD);
      obj.y = sumActual;
      obj = getXYObjectByXValue(innerComp, statDateYMD);
      obj.y = sumNominal;
    } else {
      obj = getXYObjectByXValue(innerData, statDateYMD);
      obj.y = Math.round((stat.actual_working_time / 60 / 60 / 1000) * 100) / 100; // rounding 2 digits after comma
      obj = getXYObjectByXValue(innerComp, statDateYMD);
      obj.y = Math.round(averageWorkingTime * 100) / 100; // rounding 2 digits after comma;
    }
  });

  // logger.info(JSON.stringify(innerComp));

  return ({
    actual_working_time: actualWorkingTime,
    planned_working_time: plannedWorkingTime,
    average_working_time: averageWorkingTime,
    inner_data: innerData,
    inner_comp: innerComp,
  });
};

function getXYObjectByXValue(arr, xVal) {
  for (let n = 0; n < arr.length - 1; n++) {
    if (arr[n].x === xVal) {
      return arr[n];
    }
  }
  // in case there has not been any array value
  // (return see above did not work); add a new object and return it's reference
  arr.push({ x: xVal, y: null });
  return (arr[arr.length - 1]);
}
