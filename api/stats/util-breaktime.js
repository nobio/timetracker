const moment = require('moment');
const mongoose = require('mongoose');

const TimeEntry = mongoose.model('TimeEntry');
const utilEntry = require('../entries/util-entries');

const DEFAULT_BREAK_TIME = 45 * 60; // 45 min in seconds

exports.getBreakTime = realCalc => new Promise((resolve, reject) => {
  this.getAllTimeEntriesGroupedByDate()
    .then((timeEntries) => {
      let breakTimes = []

      for (const timeItem of timeEntries.values()) {
        //console.log(timeItem);
        let breakTime = -1;
        if ((timeItem.length % 2) != 0) {
          breakTime = 0;
        }
        if (realCalc && timeItem.length === 2) {
          breakTime = 0
        }
        if (!realCalc && timeItem.length === 2) {
          breakTime = DEFAULT_BREAK_TIME;
        }
        if (breakTime === -1) {
          breakTime = timeItem.reduce((acc, timeEntry, idx) => {
            //console.log('idx=' + idx + ' timeEntry=' + timeEntry + ' acc=' + acc);
            if ((idx % 2) == 0 && idx > 0) {
              acc += timeEntry - timeItem[idx - 1];
            }
            return acc; // always return commulator
          }, 0);
        }
        console.log(`>>> ${timeItem}: ${breakTime} - ${breakTime / 60}`);
        breakTimes.push(breakTime) // TODO: not push to Array rather inc. a number with the breakTime (min) as key to genertate a historgram
      }
      resolve(breakTimes);
    })
    .catch(err => reject(err));
});

exports.getAllTimeEntriesGroupedByDate = () => new Promise((resolve, reject) => {
  utilEntry.getAll()
    .then((timeEntries) => {
      const datesFromArray = timeEntries.reduce((accumulator, timeEntry) => {
          const date_time = moment(timeEntry.entry_date).locale('de');
          const dt = date_time.format('L'); // key
          //     const time = date_time.format('LTS'); // value
          const time = date_time.format('X'); // value as Unix-Timestamp in seconds
          const item = accumulator.get(dt);
          if (item) {
            item.push(time);
          } else {
            accumulator.set(dt, [time]);
          }

          return accumulator;
        }, new Map(), //  optional initial value (here mandandory)
      );
      resolve(datesFromArray);
    })
    .catch(err => reject(err));
});
