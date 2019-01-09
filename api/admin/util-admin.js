require('../../db');
const g_util = require('../global_util');
const fs = require('fs');

const moment = require('moment');
const mongoose = require('mongoose');

const TimeEntry = mongoose.model('TimeEntry');
const TimeEntryBackup = mongoose.model('TimeEntryBackup');
const Toggle = mongoose.model('Toggle');

const NOTIFICATION_TOGGLES = {
  'name': 'CREATE_ENTRY',
  'name': 'DELETE_ENTRY',
  'name': 'BACKUP_DB',
  'name': 'DUMP_FS',
  'name': 'RECALCULATE'

};

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

// ============================= TOGGLES ====================================
exports.getAllToggles = () => new Promise((resolve, reject) => {
  Toggle.find()
    .then(result => resolve(result))
    .catch(err => reject(err))
})

exports.getNotificationToggles = () => new Promise((resolve, reject) => {
  this.getAllToggles()
    .then(toggleArray => {
      let nfToggles = {};
      toggleArray.forEach(toggle => {
        const a = NOTIFICATION_TOGGLES.find(toggle.name);
        console.log(a);
      })
      resolve(nfToggles);
    })
    .catch(err => reject(err))
})

exports.getToggle = (id) => new Promise((resolve, reject) => {
  Toggle.findById(id)
    .then(result => resolve(result))
    .catch(err => reject(err))
})

exports.createToggle = (name, toggle) => new Promise((resolve, reject) => {
  new Toggle({
      name: name,
      toggle: toggle
    }).save()
    .then(toggle => resolve(toggle))
    .catch(err => reject(err));
});

exports.deleteToggle = (id) => new Promise((resolve, reject) => {
  Toggle.findByIdAndRemove(id)
    .then(toggle => resolve(toggle))
    .catch(err => reject(err));
})

exports.deleteTestToggles = () => new Promise((resolve, reject) => {
  Toggle.deleteMany({ name: /TEST-TOGGLE/ })
    .then(result => resolve(result))
    .catch(err => reject(err));
})

exports.updateToggle = (id, toggle) => new Promise((resolve, reject) => {
  console.log(id + " " + toggle)
  Toggle.findById(id)
    .then((tog) => {
      if (tog === null) {
        resolve(null);
        return;
      }
      tog.toggle = (toggle === undefined) ? false : toggle;
      return tog;
    })
    .then(tog => tog.save())
    .then(tog => resolve(tog))
    .catch(err => reject(err));
});
