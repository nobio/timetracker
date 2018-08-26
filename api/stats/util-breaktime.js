const moment = require('moment');
const utilEntry = require('../entries/util-entries');

const DEFAULT_BREAK_TIME = 45 * 60; // 45 min in seconds

exports.getBreakTime = realCalc => new Promise((resolve, reject) => {
  utilEntry.getAll()
    .then(this.getAllTimeEntriesGroupedByDate)
    .then(timeEntries => this.prepareBreakTimes(timeEntries, realCalc))
    .then(this.calculateHistogram)
    .then(breakTimes => resolve(breakTimes))
    .catch(err => reject(err));
});

exports.getAllTimeEntriesGroupedByDate = timeEntries => new Promise((resolve, reject) => {
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
      breakTime = DEFAULT_BREAK_TIME;
    }

    if (breakTime === -1) {
      breakTime = timeItem.reduce((acc, timeEntry, idx) => {
        // console.log('idx=' + idx + ' timeEntry=' + timeEntry + ' acc=' + acc);
        if ((idx % 2) == 0 && idx > 0) {
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

exports.calculateHistogram = preparedBreakTimes => new Promise((resolve, reject) => {
  // prepare data structure regarding the interval. I.e. if interval = 60 (min) we create a structure with 24 entries (1440 min / 60 min = 24)
  const breakTimes = [];
  const numberElements = 120; // 0 min - 120 min (max 2 hours break should be enough)
  for (let t = 0; t < numberElements; t++) {
    breakTimes.push({
      time: t, // t in minutes
      breakTime: 0.0,
    });
  }

  preparedBreakTimes.reduce((acc, index) => {
    if (index <= 120) {
      breakTimes[index].breakTime++;
    }
    return acc;
  });

  resolve(breakTimes);
});
