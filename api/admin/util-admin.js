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
exports.dumpTimeEntries = async function () {
  try {
    const timeEntries = await TimeEntry.find();
    if (!fs.existsSync('./dump')) fs.mkdirSync('./dump');
    const dumpFile = `./dump/timeentry_${moment().format('YYYY-MM-DD_HHmmss')}.json`;

    fs.writeFileSync(dumpFile, JSON.stringify(timeEntries, null, 2), 'UTF8'); // use JSON.stringify for nice format of output
    console.log(`database dump saved ${timeEntries.length} items`);
    return ({
      size: timeEntries.length,
      filename: dumpFile,
    });
  } catch (error) {
    throw error;
  }
};

exports.backupTimeEntries = async function () {

  try {
    await TimeEntryBackup.deleteMany({});
    const timeEntries = await TimeEntry.find();
    console.log(`${timeEntries.length} time entries found to be backed up`);

    for (const timeentry of timeEntries) {
      new TimeEntryBackup({
        _id: timeentry._id,
        entry_date: timeentry.entry_date,
        direction: timeentry.direction,
        last_changed: timeentry.last_changed,
        longitude: timeentry.longitude,
        latitude: timeentry.latitude,
      }).save();
    };
    g_util.sendMessage('BACKUP_DB');
    return { backup_count: timeEntries.length };

  } catch (error) {
    throw error;
  }
};
