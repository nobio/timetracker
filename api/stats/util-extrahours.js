/* eslint-disable consistent-return */
/* eslint-disable no-shadow */
/* eslint-disable no-use-before-define */
/* eslint-disable max-len */
/* eslint-disable no-restricted-syntax */
/*

    Index:         1  |  2  |  3  ||  4  |  5  |  6  ||  7  |  8  |  9  ||
    ------------------|-----|-----||-----|-----|-----||-----|-----|-----||
[1] extra Hours:   1  |  0  |  2  || -1  | -1  |  0  ||  1  |  0  | -1  ||   (=day no acc)
[2] week no acc                3  ||             -2  ||              0  ||   (=diff week acc last index[n] - last index[n-1])
[3] day acc:       1  |  1  |  3  ||  2  |  1  |  1  ||  2  |  2  |  1  ||
[4] week acc                   3  ||              1  ||              1  ||   (=see last index of day acc)

*/

require('../../db');
const moment = require('moment-timezone');
const utilStats = require('./util-stats');

const startDate = moment('2023-10-01').tz('Europe/Berlin'); // start with Baader Bank

/**
 * Calculates the extra hours depending on the time unit (day, week, month, year)
 * @param {*} accumulate true if the values are supposed to be summed up
 * @param {*} timeUnit day, week, month, year
 * @returns array that contains the date, extra_hour and hour (Regelarbeitszeit)
 */
exports.getExtraHours = async (accumulate, timeUnit) => {
  try {
    // get stats data from 01.10.2023 (Baader Bank) until now
    const stats = await utilStats.getStatsByRange(
      startDate,
      moment().tz('Europe/Berlin'), // until today
      accumulate,
      false,
    );

    if (accumulate) return getExtraHoursByTimeUnitAcc(stats, timeUnit);
    return getExtraHoursByTimeUnitNoAcc(stats, timeUnit);
  } catch (error) {
    console.error(error.message);
    throw (error);
  }
};

/**
 * Calculates the extra hour by day; will be called for all time units except day
 * @param {*} stats list of statistics data of a given range (starting with 01.10.2023 - Baader Bank)
 * @param {*} accumulate  true if the values are supposed to be summed up
 * @returns array that contains the date, extra_hour and hour (Regelarbeitszeit)
 */
const getExtraHoursByDay = async (stats, accumulate) => {
  let sumExtraHour = 0;
  let sumHour = 0;

  const extraHours = [];
  for (const stat of stats.inner_data) {
    if (accumulate) {
      // see above [3]
      sumExtraHour += stat.y - 8; // difference to "normal working hours"
      sumHour += 8;
    } else {
      // see above [1]
      sumExtraHour = stat.y - 8;
      sumHour = 8;
    }

    extraHours.push({
      date: stat.x,
      extra_hour: sumExtraHour,
      hour: sumHour,
    });
  }

  return extraHours;
};

/**
 * Calculates the extra hours accumulated
 * see above [4]
 * @param {*} stats
 * @param {*} timeUnit
 * @returns
 */
const getExtraHoursByTimeUnitAcc = async (stats, timeUnit) => {
  // see above [4]
  const extraHours = [];
  const dailyExtraHours = await getExtraHoursByDay(stats, true);
  let lastEndOfTimeUnit = moment(dailyExtraHours[0].date).endOf(timeUnit);

  // iterate all accumulated days and pick the one at the and of our time unit
  dailyExtraHours.forEach((extraHour, idx) => {
    const actualEndOfTimeUnit = moment(extraHour.date).endOf(timeUnit);
    // console.log(actualEndOfTimeUnit.format('YYYY-MM-DD'), lastEndOfTimeUnit.format('YYYY-MM-DD'), extraHour);
    if (moment(extraHour.date).isAfter(lastEndOfTimeUnit)) {
      lastEndOfTimeUnit = actualEndOfTimeUnit;
      extraHours.push(dailyExtraHours[idx - 1]);
    }
  });
  extraHours.push(dailyExtraHours[dailyExtraHours.length - 1]);
  return extraHours;
};

/**
 * Calculates the extra hours not accumulated
 * see above [2]
 * @param {*} stats
 * @param {*} timeUnit
 * @returns
 */
const getExtraHoursByTimeUnitNoAcc = async (stats, timeUnit) => {
  // see above [2]
  // diff week acc last index[n] - last index[n-1]
  const extraHours = [];
  const weekyExtraHoursAcc = await getExtraHoursByTimeUnitAcc(stats, timeUnit);
  weekyExtraHoursAcc.forEach((extraHour, idx) => {
    if (idx === 0) {
      extraHours.push(extraHour);
    } else {
      extraHours.push({
        date: extraHour.date,
        extra_hour: extraHour.extra_hour - weekyExtraHoursAcc[idx - 1].extra_hour,
        hour: extraHour.hour - weekyExtraHoursAcc[idx - 1].hour,
      });
    }
  });

  return extraHours;
};
