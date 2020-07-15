const db_config = {
  mlab: {
    user: 'nobio',
    password: '1gR7hW2cPhtkRlv2',
    uri: 'ds061928.mlab.com:61928/timetrack',
  },
  options: {
    // reconnectTries: 1000,
    // reconnectInterval: 500,
    poolSize: 5,
    keepAlive: 120,
    // bufferMaxEntries: -1,
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false,
  },
};

/**
 * adding the contains method to the String object
 */
if (!String.prototype.contains) {
  String.prototype.contains = function (arg) {
    return !!~this.indexOf(arg);
  };
}

// Here you can find the schema definition of noodle data.
// The top element always is a 'noodle' which represents an appointment

console.log('init database');

const mongoose = require('mongoose');

mongoose.Promise = global.Promise;

const monoddb_options = db_config.options;
let mongodb_url = process.env.MONGO_URL; // try to use environment variable, perhaps given by container
if (!mongodb_url) {
  console.error('overwriting mongodb_url');
  mongodb_url = `mongodb://${db_config.mlab.user}:${db_config.mlab.password}@${db_config.mlab.uri}`;
}
// mongodb_url = `mongodb://${db_config.mlab.user}:${db_config.mlab.password}@${db_config.mlab.uri}`;

console.log(`connecting to mongodb on ${
  mongodb_url
} with options ${
  JSON.stringify(monoddb_options)}`);

mongoose.connect(mongodb_url, monoddb_options).then(
  () => {
    console.log('mongodb is ready to use.');
  },
  (err) => {
    console.error(`error while connecting mongodb:${err}`);
  },
);


// --------------------------------------------------
// ----------------- TimeEntry ----------------------
// --------------------------------------------------
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
mongoose.model('TimeEntry', TimeEntry);
mongoose.model('TimeEntryBackup', TimeEntry);

// --------------------------------------------------
// ------------------ StatisticsDay -----------------
// --------------------------------------------------
const StatsDay = new mongoose.Schema({
  date: {
    type: Date, required: true, default: Date.now, index: true, unique: true,
  },
  actual_working_time: { type: Number, required: true, default: 0 },
  planned_working_time: { type: Number, required: true, default: 0 },
  is_working_day: { type: Boolean, required: true, default: false },
  is_complete: { type: Boolean, required: true },
  last_changed: { type: Date, required: true, default: Date.now },
});
mongoose.model('StatsDay', StatsDay);

// --------------------------------------------------
// -------------- Notification Toggles --------------
// --------------------------------------------------
const Toggle = new mongoose.Schema({
  name: {
    type: String, required: true, index: true, unique: true,
  },
  toggle: {
    type: Boolean, required: true, default: false, index: false,
  },
  notification: {
    type: String, required: true, default: 'generic message', index: false, unique: false,
  },
});
mongoose.model('Toggle', Toggle);

// --------------------------------------------------
// ------------------ Failure Days ------------------
// --------------------------------------------------
const failureTypes = 'INCOMPLETE,WRONG_ORDER'.split(',');
const FailureDay = new mongoose.Schema({
  date: {
    type: Date, required: true, index: true, unique: true,
  },
  failure_type: { type: String, enum: failureTypes, required: true },
});
mongoose.model('FailureDay', FailureDay);

// --------------------------------------------------
// ------------------ Geo Tracking ------------------
// --------------------------------------------------
const GeoTracking = new mongoose.Schema({
  longitude: { type: Number, required: true, index: true },
  latitude: { type: Number, required: true, index: true },
  accuracy: { type: Number, required: false }, // OPTIONAL
  source: { type: String, required: true },
  altitude: { type: String, required: false }, // OPTIONAL
  date: {
    type: Date, required: true, index: true, unique: true, default: Date.now,
  },
});
mongoose.model('GeoTracking', GeoTracking);

// --------------------------------------------------
// --------------------------------------------------
// --------------------------------------------------
// -------------- Users -------------- --------------
// --------------------------------------------------
const User = new mongoose.Schema({
  name: {
    type: String, required: true, index: true, unique: true,
  },
  password: {
    type: String, required: true, default: false, index: false,
  },
});
mongoose.model('User', User);

// --------------------------------------------------
// -------------- Token -------------- --------------
// --------------------------------------------------
const Token = new mongoose.Schema({
  token: {
    type: String, required: true, index: true, unique: true,
  },
  user: {
    type: String, required: false, index: false, unique: false, default: 'ANONYMOUS',
  }
});
mongoose.model('Token', Token);

exports.closeConnection = () => {
  mongoose.connection.close(
    () => {
      console.log('mongodb is closed.');
    },
    (err) => {
      console.error(`error while closing connection mongodb:${err}`);
    },
  );
};
