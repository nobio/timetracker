const moment = require('moment');
const g_util = require('../global_util');
const utilEntry = require('../entries/util-entries');

const COUNT_MINUTES = 120; // 120 minutes for histogram (0..120)
/**
 * get an array of break times; format of one item: {time: t, breakTime: 0.0}
 * @param {true if only the 'real' values count; false if by default a 45 min break should be calculated} realCalc
 */
exports.getBreakTime = (interval, realCalc) => new Promise((resolve, reject) => {
  utilEntry.getAll()
    .then(this.getAllTimeEntriesGroupedByDate)
    .then((timeEntries) => this.prepareBreakTimes(timeEntries, realCalc))
    .then((preparedBreakTimes) => this.calculateHistogram(preparedBreakTimes, interval, realCalc))
    .then((breakTimes) => resolve(breakTimes))
    .catch((err) => reject(err));
});

/**
 * create a Map with the date as key and an array of entry_dates as value (entry_date in unix timestamp)
 * @param {all time entries sorted by entry_date} timeEntries
 */
exports.getAllTimeEntriesGroupedByDate = (timeEntries) => new Promise((resolve, reject) => {
  try {
    const datesFromArray = timeEntries.reduce((acc, timeEntry) => {
      const date_time = moment(timeEntry.entry_date).locale('de');
      const dt = date_time.format('L'); // key
      const time = date_time.format('X'); // value as Unix-Timestamp in seconds
      const item = acc.get(dt);
      if (item) {
        item.push(time);
      } else {
        acc.set(dt, [time]);
      }

      return acc;
    }, new Map(), //  optional initial value (here mandandory)
    );
    resolve(datesFromArray);
  } catch (err) {
    reject(err);
  }
});

/**
 * prepare the array from getAllTimeEntriesGroupedByDate method and calculate for each item in
 * this map a break time from the array of entry_dates
 *
 * @param {all time entries sorted by entry_date} timeEntries
 * @param {true if only the 'real' values count; false if by default a 45 min break should be calculated} realCalc
 */
exports.prepareBreakTimes = (timeEntries, realCalc) => new Promise((resolve, reject) => {
  const breakTimes = [];
  for (const timeItem of timeEntries.values()) {
    // console.log(timeItem);
    let breakTime = -1;
    if ((timeItem.length % 2) != 0) {
      breakTime = 0;
    }
    if (realCalc && timeItem.length === 2) {
      breakTime = 0;
    }
    if (!realCalc && timeItem.length === 2) {
      breakTime = g_util.getBreakTimeSeconds(timeItem[0]);
    }

    if (breakTime === -1) {
      breakTime = timeItem.reduce((acc, timeEntry, idx) => {
        // console.log('idx=' + idx + ' timeEntry=' + timeEntry + ' acc=' + acc);
        if ((idx % 2) === 0 && idx > 0) {
          acc += timeEntry - timeItem[idx - 1];
        }
        return acc; // always return commulator
      }, 0);
    }
    // console.log(`>>> ${timeItem}: ${breakTime} - ${breakTime / 60}`);
    breakTimes.push(Math.round(breakTime / 60));
  }
  resolve(breakTimes);
});

/**
 * calculate a historgram; key is the minute (0..120) and valus is the number of counts for this minute
 *
 * @param {*} preparedBreakTimes
 */
exports.calculateHistogram = (preparedBreakTimes, interval, realCalc) => new Promise((resolve, reject) => {
  // prepare data structure regarding the interval.
  const breakTimes = [];

  for (let t = 0; t <= COUNT_MINUTES; t += interval) {
    breakTimes.push({
      time: t, // t in minutes
      breakTime: 0.0,
    });
  }

  // iterating over preparedBreakTimes but not manipulating this array rather than the array breakTimes;
  // ok, could have been done also in a classic way using the iterator and loops...
  // "index" is the break time in minutes

  const idx = parseInt((preparedBreakTimes[0] - 1) / interval);
  breakTimes[idx].breakTime++; // TODO: also take the measurements during the interval into account!!!

  preparedBreakTimes.reduce((acc, breakTimeMin) => {
    const idx = parseInt((breakTimeMin - 1) / interval);
    if (idx > 0 && idx < breakTimes.length && !(realCalc && breakTimeMin === 0)) { // ignore longer breaks and in case of realCalc the 0 value (all calculated values end up with 0)
      // console.log('length: ' + breakTimes.length + ' - index: ' + breakTimeMin + ' - calculated idx: ' + idx);
      breakTimes[idx].breakTime++; // TODO: also take the measurements during the interval into account!!!
    }
    return acc;
  });

  resolve(breakTimes);
});
