const mongoose = require('mongoose');
const moment = require('moment');

const TimeEntry = mongoose.model('TimeEntry');

/*
 * ping functionality - resonses a pong ;-)
 *
 * curl -X GET http://localhost:30000/ping
 */
exports.ping = (req, res) => {
  res.send({
    response: 'pong',
  });
};

/*
 * test and experiment endpoint
 *
 * curl -X GET http://localhost:30000/experiment
 */
exports.experiment = (req, res) => {
  let entriesFromDate = [];
  const firstDates = [];
  let actualDate;

  TimeEntry.find().sort({ entry_date: 1 })
    .catch(err => res.send(err))
    .then((timeentries) => {
      timeentries.forEach((timeEntry) => {
        const myDate = moment(timeEntry.entry_date).format('YYYY-MM-DD');
        if (!actualDate) {
          actualDate = myDate;
        }
        if (actualDate == myDate && timeEntry.direction == 'enter') {
          entriesFromDate.push(timeEntry);
        } else {
          firstDates.push(entriesFromDate.reduce((mapped, value) => {
            const m = moment(mapped.entry_date).format('HH:mm');
            const v = moment(value.entry_date).format('HH:mm');
            // console.log(m + ' ' + v + ' -> ' + (m>v));
            if (m < v) {
              return mapped;
            }
            return value;
          }));
          entriesFromDate = [];
          actualDate = undefined;
        }
        console.log(firstDates.length);
      });
      console.log(firstDates);
      res.send('Minimum:\n');
    });
};

/*
exports.test = (req, res) => {
    TimeEntry.find().sort({entry_date: 1})
    .catch(err => res.send(err))
    .then(timeentries => {
        var mini = timeentries.reduce((mapped, value) => {
            var m = moment(mapped.entry_date).format('HH:mm');
            var v = moment(value.entry_date).format('HH:mm');
            //console.log(m + ' ' + v + ' -> ' + (m>v));
            if(m < v) {
                return mapped;
            } else {
                return value;
            }
        });
        res.send('Minimum: ' + moment(mini.entry_date).format('HH:mm')  + '\n');
    });
};
*/

/*
 * deletes all TimeEntry-items from database. This should only be used during development time
 * and later either deleted or put behind some special user privileges
 *
 * curl -X DELETE http://localhost:30000/entries
 */
/*
exports.deleteAllTimeEntries = (req, res) => {
  let size;
  TimeEntry.find((err, timeentries) => {
    size = timeentries.length;
    timeentries.forEach((timeentry) => {
      console.log(timeentry);
      timeentry.remove();
    });
    console.log(`deleted ${size} items`);
    res.send({
      size,
    });
  });
};
*/

/*
 * creates random Time Entries; supposed to be used after cleaning the TimeEntry table
 *
 * curl -X PUT http://localhost:30000/admin/rnd_entries
 */
/*
exports.setRandomTimeEntries = (req, res) => {
  const DAY_IN_SECS = 60 * 60 * 24;
  const now = moment().unix();
  const today = now - (now % DAY_IN_SECS);

  console.log(today);

  for (let t = today - 18 * DAY_IN_SECS; t < today + 180 * DAY_IN_SECS; t += DAY_IN_SECS) {
    const dt = moment(t);
    console.log(`${t}: ${dt.format('DD.MM.YYYY HH:mm:ss')}`);

    const countEntries = 1 + Math.floor(Math.random() * 3);
    console.log(`Anzahl Eiträge: ${countEntries * 2}`);

    let pointer = t + 60 * 60 * 5;
    // 5 hours offset per day
    for (let i = 0; i < countEntries; i++) {
      let varianz = Math.floor(Math.random() * 60 * 60 * 4);
      // random range +/- 60 min
      const start = pointer + varianz - 60 * 60;

      varianz += Math.floor(Math.random() * 60 * 60 * 4);
      // random range +/- 30 min
      const end = start + varianz - 60 * 60;

      console.log(`Start: ${moment(1000 * start).format('DD.MM.YYYY HH:mm:ss')} - End: ${moment(1000 * end).format('DD.MM.YYYY HH:mm:ss')}`);
      pointer = end + 61 * 60;

      new TimeEntry({
        entry_date: moment(1000 * start),
        direction: 'enter',
        isWorkingDay: false,
      }).save((err, timeentry) => {
        if (err) {
          console.log(err);
        }
      });

      new TimeEntry({
        entry_date: moment(1000 * end),
        direction: 'go',
        isWorkingDay: false,
      }).save((err, timeentry) => {
        if (err) {
          console.log(err);
        }
      });
    }
  }

  res.send({
    now: today,
  });
};
*/
