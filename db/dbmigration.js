const MONGO_URL_MLAB = 'mongodb://nobio:1gR7hW2cPhtkRlv2@ds061928.mlab.com:61928/timetrack';
const MONGO_URL_DOCKER = 'mongodb://qnap-nas:27017/timetracker';

const MONGO_URL_SOURCE = MONGO_URL_MLAB;
const MONGO_URL_TARGET = MONGO_URL_DOCKER;

let migrationData = [];

/* ==================================================================== */

const mongoose = require('mongoose');
const schema = mongoose.Schema;
mongoose.Promise = global.Promise;



// Schema
const directions = 'enter go'.split(' ');
const TimeEntry = new schema({
 entry_date: { type: Date, required: true, default: Date.now, index: true },
 direction: { type: String, enum: directions, required: true },
 last_changed: { type: Date, default: Date.now, required: true },
 longitude: { type: Number, required: false },
 latitude: { type: Number, required: false },
});
const timeEntry = mongoose.model('TimeEntry', TimeEntry);


console.log('connecting to ' + MONGO_URL_SOURCE + '...');
mongoose.connect(MONGO_URL_SOURCE, { useNewUrlParser: true }).then(
 () => {
  console.log('...connected');
  return;
 },
 (err) => {
  console.log(`error while connecting mongodb:${err}`);
 },
);

timeEntry.find()
 .then(timeentries => migrationData = timeentries)
 .catch(err => console.log(err.message));


console.log(migrationData.length)
