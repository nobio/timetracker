require('../../db');
const g_util = require('../global_util');
const fs = require('fs');

const moment = require('moment');
const mongoose = require('mongoose');

const TimeEntry = mongoose.model('TimeEntry');
const TimeEntryBackup = mongoose.model('TimeEntryBackup');
const Toggle = mongoose.model('Toggle');

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
    .then(g_util.sendMessage('DUMP_FS'))
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
    .then(g_util.sendMessage('BACKUP_DB'))
    .catch(err => reject(err));
});

// ============================= TOGGLES ====================================
exports.getAllToggles = () => new Promise((resolve, reject) => {
  Toggle.find()
    .then(result => resolve(result))
    .catch(err => reject(err));
});

exports.getToggle = id => new Promise((resolve, reject) => {
  Toggle.findById(id)
    .then(result => resolve(result))
    .catch(err => reject(err));
});

exports.getToggleByName = name => new Promise((resolve, reject) => {
  Toggle.findOne({ name })
    .then(result => resolve(result))
    .catch(err => reject(err));
});

exports.getToggleStatus = () => new Promise((resolve, reject) => {
  resolve({
    NOTIFICATION_SLACK: (process.env.SLACK_TOKEN != null && process.env.SLACK_TOKEN != undefined),
  });
});

exports.createToggle = (name, toggle, notification) => new Promise((resolve, reject) => {
  new Toggle({
    name,
    toggle,
    notification,
  }).save()
    .then(toggle => resolve(toggle))
    .catch(err => reject(err));
});

exports.deleteToggle = id => new Promise((resolve, reject) => {
  Toggle.findByIdAndRemove(id)
    .then(toggle => resolve(toggle))
    .catch(err => reject(err));
});

exports.deleteTestToggles = () => new Promise((resolve, reject) => {
  Toggle.deleteMany({ name: /TEST-TOGGLE/ })
    .then(resolve('all test tokens deleted'))
    .catch(err => reject(err));
});

exports.updateToggle = (id, toggle, notification) => new Promise((resolve, reject) => {
  Toggle.findById(id)
    .then((tog) => {
      if (tog === null) {
        resolve(null);
        return;
      }
      tog.toggle = (toggle === undefined || toggle === null) ? tog.toggle : toggle; // maybe, only notification is pased
      tog.notification = (notification === undefined || notification === null) ? '' : notification;
      return tog;
    })
    .then(tog => tog.save())
    .then(tog => resolve(tog))
    .catch(err => reject(err));
});
