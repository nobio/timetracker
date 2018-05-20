const db_config = {
  mlab: {
    user: 'nobio',
    password: '1gR7hW2cPhtkRlv2',
    uri: 'ds061928.mlab.com:61928/timetrack',
    options: {
      useMongoClient: true,
      reconnectTries: 1000,
      reconnectInterval: 500,
      poolSize: 5,
      keepAlive: 120,
      bufferMaxEntries: -1,
    },
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
const schema = mongoose.Schema;
mongoose.Promise = global.Promise;

// TimeEntry
const directions = 'enter go'.split(' ');
const TimeEntry = new schema({
  entry_date: { type: Date, required: true, default: Date.now, index: true },
  direction: { type: String, enum: directions, required: true },
  last_changed: { type: Date, default: Date.now, required: true },
  longitude: { type: Number, required: false },
  latitude: { type: Number, required: false },
});
mongoose.model('TimeEntry', TimeEntry);
mongoose.model('TimeEntryBackup', TimeEntry);

// StatisticsDay
const StatsDay = new schema({
  date: {
    type: Date,
    required: true,
    default: Date.now,
    index: true,
    unique: true,
  },
  actual_working_time: { type: Number, required: true, default: 0 },
  planned_working_time: { type: Number, required: true, default: 0 },
  is_working_day: { type: Boolean, required: true, default: false },
  is_complete: { type: Boolean, required: true },
  last_changed: { type: Date, required: true, default: Date.now },
});
mongoose.model('StatsDay', StatsDay);

const mongodb_url =
`mongodb://${
  db_config.mlab.user
}:${
  db_config.mlab.password
}@${
  db_config.mlab.uri}`;
const monoddb_options = db_config.mlab.options;

console.log(
  `connecting to mongodb on ${
    mongodb_url
  } with options ${
    JSON.stringify(monoddb_options)}`,
);
mongoose.connect(mongodb_url, monoddb_options).then(
  () => {
    console.log('mongodb is ready to use.');
  },
  (err) => {
    console.log(`error while connecting mongodb:${err}`);
  },
);
exports.closeConnection = () => {
  mongoose.connection.close(
    () => {
      console.log('mongodb is closed.');
    },
    (err) => {
      console.log(`error while closing connection mongodb:${err}`);
    },
  );
};
