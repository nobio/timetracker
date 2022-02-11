const models = require('./models');

/* eslint-disable no-console */
const MONGODB_OPTIONS = {
  // reconnectTries: 1000,
  // reconnectInterval: 500,
  // poolSize: 5,
  keepAlive: true,
  // bufferMaxEntries: -1,
  // useCreateIndex: true,
  useNewUrlParser: true,
  useUnifiedTopology: true,
  // useFindAndModify: false,
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
let mongodbUrl = process.env.MONGODB_URL; // try to use environment variable, perhaps given by container
if (!mongodbUrl) {
  console.error('overwriting mongodb_url');
  mongodbUrl = `mongodb+srv://${db_config.atlas.user}:${db_config.atlas.password}@${db_config.atlas.uri}`;
}
console.log(`connecting to mongodb (${mongodbUrl})`);

mongoose.connect(mongodbUrl, MONGODB_OPTIONS).then(
  () => {
    console.log('mongodb is ready to use.');
  },
  (err) => {
    console.error(`error while connecting mongodb:${err}`);
  },
);

mongoose.model('TimeEntry', models.TimeEntry);
mongoose.model('TimeEntryBackup', models.TimeEntry);
mongoose.model('StatsDay', models.StatsDay);
mongoose.model('Toggle', models.Toggle);
mongoose.model('Properties', models.Properties);
mongoose.model('FailureDay', models.FailureDay);
mongoose.model('GeoTracking', models.GeoTracking);
mongoose.model('User', models.User);
mongoose.model('Token', models.Token);


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
