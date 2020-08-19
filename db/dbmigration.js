#!/usr/local/bin/node
/* eslint-disable no-console */

const mongoose = require('mongoose');

mongoose.set('useUnifiedTopology', true);
mongoose.set('useCreateIndex', true);
mongoose.set('useNewUrlParser', true);

const MONGO_URL_MLAB = 'mongodb://nobio:1gR7hW2cPhtkRlv2@ds061928.mlab.com:61928/timetrack';
const MONGO_URL_DOCKER = 'mongodb://qnap-nas:27017/timetracker';
// const MONGO_URL_DOCKER = 'mongodb://192.168.178.42::27017/timetracker';

// const MONGO_URL_SOURCE = MONGO_URL_MLAB;
// const MONGO_URL_TARGET = MONGO_URL_DOCKER;
const MONGO_URL_SOURCE = MONGO_URL_DOCKER;
const MONGO_URL_TARGET = MONGO_URL_MLAB;

const HELP = process.argv.includes('-h');
const SHOULD_EMPTY_TARGET = !process.argv.includes('-d');
const SILENT = process.argv.includes('-s');
const SUCCESS_ONLY = process.argv.includes('-c');

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
const GeoTracking = new mongoose.Schema({
  longitude: { type: Number, required: true, index: true },
  latitude: { type: Number, required: true, index: true },
  accuracy: { type: Number, required: true },
  source: { type: String, required: true },
  date: {
    type: Date, required: true, index: true, unique: true, default: Date.now,
  },
});
/* ====================-================================================ */

const connectionSource = mongoose.createConnection(MONGO_URL_SOURCE);
const connectionTarget = mongoose.createConnection(MONGO_URL_TARGET);

const TIME_ENTRY_MODEL_SOURCE = connectionSource.model('TimeEntry', TimeEntry);
const TIME_ENTRY_MODEL_TARGET = connectionTarget.model('TimeEntry', TimeEntry);
const GEO_TRACKING_MODEL_SOURCE = connectionSource.model('GeoTracking', GeoTracking);
const GEO_TRACKING_MODEL_TARGET = connectionTarget.model('GeoTracking', GeoTracking);
mongoose.model('GeoTracking', GeoTracking);

console.log('--------------------------------------------------------------- \n');
console.log('Usage: node db/dbmigration.js [-d] [-s]');
console.log('   -h: display this');
console.log('   -d: emtpy target collection');
console.log('   -s: silent');
console.log('   -c: only success, no errors');
console.log('\n--------------------------------------------------------------- ');

/**
 * Reads data from source data source and returns an json array
 */
function getDataFromSource(source) {
  return new Promise((resolve, reject) => {
    console.log('connecting to source database');

    source.find()
      .then((entries) => {
        console.log('closing source database');
        // mongoose.connection.close();
        resolve(entries);
      })
      .catch((err) => {
        mongoose.connection.close();
        reject(err);
      });
  });
}

function deleteAllTarget(target) {
  return new Promise((resolve, reject) => {
    if (SHOULD_EMPTY_TARGET) {
      resolve('no delete');
      return;
    }
    console.log('connecting to target database');
    console.log('deleting target data');
    target.deleteMany({})
      .then(() => resolve('deletion ok'))
      .catch(err => reject(err));
  });
}

/**
 * Stores the data to target data srouce read from source data source
 *
 * @param {entries} entries
 */
function storeDataToTarget(entries, target) {
  return new Promise((resolve, reject) => {
    let n = 0;
    entries.forEach((entry) => {
      process.stdout.write('.');
      // console.log(Object.keys(TIME_ENTRY_MODEL_TARGET.schema.tree))
      const t = new target();
      Object.keys(target.schema.tree).forEach((element) => {
        t[element] = entry[element];
      });
      t.save()
        .then(() => {
          // eslint-disable-next-line no-underscore-dangle
          console.log(`saved: ${target.modelName} - ObjectId('${entry._id}')`);
          n += 1;
          if (n >= entries.length) {
            //mongoose.connection.close();
            resolve();
            //process.exit(0);
          }
        })
        .catch((err) => {
          n += 1;
          if (!SILENT && !SUCCESS_ONLY) console.error(`> ${n} ${err.message}`);
          if (n >= entries.length) {
            //mongoose.connection.close();
            //process.exit(-1);
          }
          reject(err);
        });
    });

    mongoose.connection.close();
    resolve(`${entries.length} elements saved`);
  });
}

if (HELP) process.exit(0);

// start the migration...
/*
deleteAllTarget(TIME_ENTRY_MODEL_TARGET)
  .then(() => getDataFromSource(TIME_ENTRY_MODEL_SOURCE))
  .then(entries => storeDataToTarget(entries, TIME_ENTRY_MODEL_TARGET))

  .then(deleteAllTarget(GEO_TRACKING_MODEL_TARGET))
  .then(() => getDataFromSource(GEO_TRACKING_MODEL_SOURCE))
  .then(entries => storeDataToTarget(entries, GEO_TRACKING_MODEL_TARGET))
  .catch((err) => {
    console.err(err);
    console.err('***********************************************************************');
    process.exit(-1);
  });
*/
const app = async () => {

  try {
    let entries;
    await deleteAllTarget(GEO_TRACKING_MODEL_TARGET);
    entries = await getDataFromSource(GEO_TRACKING_MODEL_SOURCE);
    await storeDataToTarget(entries, GEO_TRACKING_MODEL_TARGET);

    await deleteAllTarget(TIME_ENTRY_MODEL_TARGET);
    entries = await getDataFromSource(TIME_ENTRY_MODEL_SOURCE);
    await storeDataToTarget(entries, TIME_ENTRY_MODEL_TARGET);
    //process.exit(0);

  } catch (err) {
    console.err(err);
    console.err('***********************************************************************');
    process.exit(-1);
  }
};

app();
