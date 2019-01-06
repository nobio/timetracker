require('../../db');
const g_util = require('../global_util');
const fs = require('fs');

const moment = require('moment');
const mongoose = require('mongoose');

const TimeEntry = mongoose.model('TimeEntry');
const TimeEntryBackup = mongoose.model('TimeEntryBackup');

/**
 * function dump the whole database to a file. This file is located in the "dump" folder
 */
exports.dumpTimeEntries = () => new Promise((resolve, reject) => {
  TimeEntry.find()
    .then((timeEntries) => {
      fs.stat('./dump', (err) => {
        if (err) {
          fs.mkdirSync('./dump');
        }

        const dumpFile = `./dump/timeentry_${moment().format('YYYY-MM-DD_HHmmss')}.json`;

        fs.writeFileSync(dumpFile, JSON.stringify(timeEntries, null, 2), 'UTF8'); // use JSON.stringify for nice format of output
        console.log(`database dump saved ${timeEntries.length} items`);
        resolve({
          size: timeEntries.length,
          filename: dumpFile,
        });
      });
    })
    .then(g_util.sendMessage('data has been dumped to file system'))
    .catch(err => reject(err));
});

exports.backupTimeEntries = () => new Promise((resolve, reject) => {
  let len = 0;
  TimeEntryBackup.remove()
    .then(() => TimeEntry.find())
    .then((timeEntries) => {
      console.log(`${timeEntries.length} time entries found to be backed up`);
      len = timeEntries.length;
      timeEntries.forEach((timeentry) => {
        // console.log('.')
        new TimeEntryBackup({
          _id: timeentry._id,
          entry_date: timeentry.entry_date,
          direction: timeentry.direction,
          last_changed: timeentry.last_changed,
          longitude: timeentry.longitude,
          latitude: timeentry.latitude,
        }).save();
      });
    })
    .then(() => resolve({ backup_count: len }))
    .then(g_util.sendMessage('statistics have been backed up to database table'))
    .catch(err => reject(err));
});
