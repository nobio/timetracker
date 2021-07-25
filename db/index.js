/* eslint-disable no-console */
const db_config = {
  mlab: {
    user: 'nobio',
    password: '1gR7hW2cPhtkRlv2',
    uri: 'ds061928.mlab.com:61928/timetrack',
  },
  atlas: {
    user: 'timetracker-user',
    password: 'cyfgeq-mypnu9-vozFyv',
    uri: 'nobiocluster.arj0i.mongodb.net/timetrack?retryWrites=true&w=majority',
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

const monoddbOptions = db_config.options;
let mongodbUrl = process.env.MONGO_URL; // try to use environment variable, perhaps given by container
if (!mongodbUrl) {
  console.error('overwriting mongodb_url');
  // mongodb_url = `mongodb://${db_config.mlab.user}:${db_config.mlab.password}@${db_config.mlab.uri}`;
  mongodbUrl = `mongodb+srv://${db_config.atlas.user}:${db_config.atlas.password}@${db_config.atlas.uri}`;
}
// mongodb_url = `mongodb://${db_config.mlab.user}:${db_config.mlab.password}@${db_config.mlab.uri}`;

console.log(`connecting to mongodb on ${mongodbUrl} with options ${JSON.stringify(monoddbOptions)}`);

mongoose.connect(mongodbUrl, monoddbOptions).then(
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
// ----------------- Properties ---------------------
// --------------------------------------------------
const Properties = new mongoose.Schema({
  key: {
    type: String, required: true, index: true, unique: true,
  },
  value: {
    type: String, required: true, index: false, unique: false,
  },
});
mongoose.model('Properties', Properties);

// --------------------------------------------------
// ------------------ Failure Days ------------------
// --------------------------------------------------
const failureTypes = 'INCOMPLETE,WRONG_ORDER'.split(',');
const FailureDay = new mongoose.Schema({
  date: {
    type: Date, required: true, index: false, unique: false,
  },
  failure_type: { 
    type: String, enum: failureTypes, required: true, index: false, unique: false,
  },
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
// -------------- Users -------------- --------------
// --------------------------------------------------
const User = new mongoose.Schema({
  username: {
    type: String, required: true, index: true, unique: true,
  },
  password: {
    type: String, required: true, default: false, index: false,
  },
  name: {
    type: String, required: true, index: false, unique: false,
  },
  mailaddress: {
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
    type: String, required: false, index: true, unique: false, default: 'ANONYMOUS',
  },
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
