#!/usr/local/bin/node

const mongoose = require('mongoose');

mongoose.set('useUnifiedTopology', true);
mongoose.set('useCreateIndex', true);
mongoose.set('useNewUrlParser', true);

const schema = mongoose.Schema;

const MONGO_URL_MLAB = 'mongodb://nobio:1gR7hW2cPhtkRlv2@ds061928.mlab.com:61928/timetrack';
const MONGO_URL_DOCKER = 'mongodb://qnap-nas:27017/timetracker';
//const MONGO_URL_DOCKER = 'mongodb://192.168.178.42::27017/timetracker';

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

console.log('--------------------------------------------------------------- \n')
console.log('Usage: node db/dbmigration.js [-d]     (emtpy target collection)')
console.log('\n--------------------------------------------------------------- ')

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
    if(!process.argv.includes('-d')) {
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
  let n = 0;
  return new Promise((resolve, reject) => {
    entries.forEach((entry) => {
      process.stdout.write('.');
      //console.log(Object.keys(TIME_ENTRY_MODEL_TARGET.schema.tree))
      const t = new target();
      Object.keys(target.schema.tree).forEach(element => {
        t[element] = entry[element];        
      });
      t.save()
        .then((doc) => {
          console.log(`saved: ${target.modelName} - ObjectId('${entry._id}')`);
          n++;
          if (n >= entries.length) {
            mongoose.connection.close();
            resolve();
            process.exit(0);
          }
        })
        .catch((err) => {
          n++;
          console.error(`> ${n} ${err.message}`);
          if (n >= entries.length) {
            mongoose.connection.close();
            process.exit(-1);
          }
          reject(err);
        });
    });

    mongoose.connection.close();
    resolve(`${entries.length} elements saved`);
  });
}

// start the migration...
deleteAllTarget(TIME_ENTRY_MODEL_TARGET)
  .then(reply => getDataFromSource(TIME_ENTRY_MODEL_SOURCE))
  .then(entries => storeDataToTarget(entries, TIME_ENTRY_MODEL_TARGET))

  .then(deleteAllTarget(GEO_TRACKING_MODEL_TARGET))
  .then(reply => getDataFromSource(GEO_TRACKING_MODEL_SOURCE))
  .then(entries => storeDataToTarget(entries, GEO_TRACKING_MODEL_TARGET))
  
  .catch((err) => {
    console.log(err);
    console.log('***********************************************************************');
    process.exit(-1);
  });
