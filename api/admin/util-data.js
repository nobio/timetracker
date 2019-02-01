// require('../../db');
const utilEntry = require('../entries/util-entries');

const MONGO_URL_TARGET = 'mongodb://nobio:1gR7hW2cPhtkRlv2@ds061928.mlab.com:61928/timetrack';
const mongoose = require('mongoose');

const directions = 'enter go'.split(' ');

exports.replicateTimeEntries = () => new Promise((resolve, reject) => {
  let timeEntriesToBeSaved; // all time entires needed to be saved

  utilEntry.getAll()
    .then((timeEntries) => {
      timeEntriesToBeSaved = timeEntries;
      connectTargetDB();
    })
    .then((targetModel) => {
      console.log(targetModel);
      saveDataToTarget(targetModel, timeEntriesToBeSaved);
    })
  // .then(reply => mongoose.connection.close())
    .then(reply => resolve(`${timeEntriesToBeSaved.length} entries replicated\n`))
    .catch(err => reject(err));
});

let connectTargetDB = () => new Promise((resolve, reject) => {
  const targetConnection = mongoose.createConnection(MONGO_URL_TARGET);

  // stored in 'testB' database
  const TimeEntryBackup = targetConnection.model('TimeEntryBackup', new mongoose.Schema({
    entry_date: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    direction: { type: String, enum: directions, required: true },
    last_changed: { type: Date, default: Date.now, required: true },
    longitude: { type: Number, required: false },
    latitude: { type: Number, required: false },
  }));

  TimeEntryBackup.find()
    .then(e => console.log(e.length));


  resolve(TimeEntryBackup);
});

let saveDataToTarget = (targetModel, timeEntries) => new Promise((resolve, reject) => {
  console.log('saveDataToTarget entered');
  console.log(targetModel);
  targetModel.find()
    .then(entries => console.log(entries.length))
    .catch(err => reject(err));
  /*
  timeEntries.forEach((timeentry) => {
   process.stdout.write('.');
   new TIME_ENTRY_MODEL_TARGET({
     _id: timeentry._id,
     entry_date: timeentry.entry_date,
     direction: timeentry.direction,
     last_changed: timeentry.last_changed,
     longitude: timeentry.longitude,
     latitude: timeentry.latitude,
    }).save()
    .then((doc) => {
     console.log(`saved: ObjectId('${timeentry._id}')`);
     n++;
     if (n >= timeEntries.length) { mongoose.connection.close(); }
    })
    .catch((err) => {
     console.error(err.message);
     n++;
     if (n >= timeEntries.length) { mongoose.connection.close(); }
     // reject(err);
    });
  });
  */
  resolve(`${timeEntries.length} elements saved`);
});
