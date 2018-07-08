const mongoose = require('mongoose');

const schema = mongoose.Schema;

const MONGO_URL_MLAB = 'mongodb://nobio:1gR7hW2cPhtkRlv2@ds061928.mlab.com:61928/timetrack';
const MONGO_URL_DOCKER = 'mongodb://qnap-nas:27017/timetracker';

const MONGO_URL_SOURCE = MONGO_URL_MLAB;
const MONGO_URL_TARGET = MONGO_URL_DOCKER;


const migrationData = [];

/* ==================================================================== */

// Schema
const directions = 'enter go'.split(' ');
const TimeEntry = new schema({
  entry_date: {
    type: Date, required: true, default: Date.now, index: true,
  },
  direction: { type: String, enum: directions, required: true },
  last_changed: { type: Date, default: Date.now, required: true },
  longitude: { type: Number, required: false },
  latitude: { type: Number, required: false },
});

const TIME_ENTRY_MODEL = mongoose.model('TimeEntry', TimeEntry);

/**
 * Reads data from source data source and returns an json array 
 */
function getDataFromSource() {
  return new Promise((resolve, reject) => {
    mongoose.connect(MONGO_URL_SOURCE, { useNewUrlParser: true });

    TIME_ENTRY_MODEL.find()
      .then((timeEntries) => {
        mongoose.connection.close();
        resolve(timeEntries);
      })
      .catch((err) => {
        mongoose.connection.close();
        reject(err);
      });
  });
}

/**
 * Stores the data to target data srouce read from source data source
 *  
 * @param {timeEntries} timeEntries 
 */
function storeDataToTarget(timeEntries) {
  return new Promise((resolve, reject) => {
    mongoose.connect(MONGO_URL_TARGET, { useNewUrlParser: true });
    TIME_ENTRY_MODEL.find()
    .then((timeEntries) => {
        mongoose.connection.close();
        resolve(timeEntries.length);
      })
      .catch((err) => {
        mongoose.connection.close();
        reject(err);
      });
  });
}

// start the migration...
getDataFromSource()
  .then(storeDataToTarget)
  .then(l => console.log(l))
  .catch(err => {
    console.log(err);
    process.exit(-1)
  });
