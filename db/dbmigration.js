#!/usr/local/bin/node

const mongoose = require('mongoose');

mongoose.set('useUnifiedTopology', true);
mongoose.set('useCreateIndex', true);
mongoose.set('useNewUrlParser', true);

const schema = mongoose.Schema;

const MONGO_URL_MLAB = 'mongodb://nobio:1gR7hW2cPhtkRlv2@ds061928.mlab.com:61928/timetrack';
// const MONGO_URL_DOCKER = 'mongodb://qnap-nas:27017/timetracker';
const MONGO_URL_DOCKER = 'mongodb://192.168.178.46:27017/timetracker';

// const MONGO_URL_SOURCE = MONGO_URL_MLAB;
// const MONGO_URL_TARGET = MONGO_URL_DOCKER;
const MONGO_URL_SOURCE = MONGO_URL_DOCKER;
const MONGO_URL_TARGET = MONGO_URL_MLAB;

/* ==================================================================== */
// Schema
const directions = 'enter go'.split(' ');
const TimeEntry = new mongoose.Schema({
  entry_date: {
    type: Date, required: true, default: Date.now, index: true,
  },
  direction: { type: String, enum: directions, required: true },
  last_changed: { type: Date, default: Date.now, required: true },
  longitude: { type: Number, required: false },
  latitude: { type: Number, required: false },
});
/* ==================================================================== */

const connectionSource = mongoose.createConnection(MONGO_URL_SOURCE);
const connectionTarget = mongoose.createConnection(MONGO_URL_TARGET);

const TIME_ENTRY_MODEL_SOURCE = connectionSource.model('TimeEntry', TimeEntry);
const TIME_ENTRY_MODEL_TARGET = connectionTarget.model('TimeEntry', TimeEntry);
// const TIME_ENTRY_MODEL_TARGET = connectionTarget.model('TimeEntryBackup', TimeEntry);

/**
 * Reads data from source data source and returns an json array
 */
function getDataFromSource() {
  return new Promise((resolve, reject) => {
    console.log('connecting to source database');

    TIME_ENTRY_MODEL_SOURCE.find()
      .then((timeEntries) => {
        console.log('closing source database');
        // mongoose.connection.close();
        resolve(timeEntries);
      })
      .catch((err) => {
        mongoose.connection.close();
        reject(err);
      });
  });
}

function deleteAllTarget() {
  console.log('connecting to target database');

  return new Promise((resolve, reject) => {
    TIME_ENTRY_MODEL_TARGET.remove()
      .then(() => resolve('deletion ok'))
      .catch(err => reject(err));
  });
}

/**
 * Stores the data to target data srouce read from source data source
 *
 * @param {timeEntries} timeEntries
 */
function storeDataToTarget(timeEntries) {
  let n = 0;
  return new Promise((resolve, reject) => {
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
          if (n >= timeEntries.length) {
            mongoose.connection.close();
            resolve();
            process.exit(0);
          }
        })
        .catch((err) => {
          n++;
          console.error(`> ${n} ${err.message}`);
          if (n >= timeEntries.length) {
            console.log('=========================== finite =============================');
            mongoose.connection.close();
          }
          reject(err);
        });
    });

    mongoose.connection.close();
    resolve(`${timeEntries.length} elements saved`);
  });
}

// start the migration...
/*
deleteAllTarget()
    .then(result => {
        console.log(result)
        process.exit(0)
    })
    .catch((err) => {
        console.log(err);
        console.log('***********************************************************************')
        process.exit(-1);
    });
*/

deleteAllTarget()
  .then(getDataFromSource)
  .then(storeDataToTarget)
  // .then(msg => console.log(msg))
  .catch((err) => {
    console.log(err);
    console.log('***********************************************************************');
    process.exit(-1);
  });
