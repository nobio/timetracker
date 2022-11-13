/* eslint-disable max-len */
const mongoose = require('mongoose');
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

// Here you can find the schema definition of noodle data.
// The top element always is a 'noodle' which represents an appointment

console.log('init database');
let mongodbUrl;
mongoose.Promise = global.Promise;

if (process.env.MONGODB_URL) {
  mongodbUrl = process.env.MONGODB_URL;
} else if (process.env.MONGODB_PROTOCOL && process.env.MONGODB_USER && process.env.MONGODB_PASSWORD && process.env.MONGODB_URI) {
  mongodbUrl = `${process.env.MONGODB_PROTOCOL}://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_URI}`;
} else {
  console.log(`error configuring database: please provide env variables MONGODB_PROTOCOL (${process.env.MONGODB_PROTOCOL}) MONGODB_USER (${process.env.MONGODB_USER}) and MONGODB_PASSWORD (${process.env.MONGODB_PASSWORD}) and MONGODB_URI (${process.env.MONGODB_URI})`);
  process.exit(1);
}
console.log(`connecting to mongodb (${mongodbUrl})`);

mongoose.connect(mongodbUrl, MONGODB_OPTIONS).then(
  () => {
    console.log('mongodb is ready to use.');
  },
  (err) => {
    console.error(`error while connecting mongodb: ${err}`);
    process.exit(1);
  },
);

mongoose.model('TimeEntry', models.TimeEntry);
mongoose.model('TimeEntryBackup', models.TimeEntry);
mongoose.model('StatsDay', models.StatsDay);
mongoose.model('Toggle', models.Toggle);
mongoose.model('Properties', models.Properties);
mongoose.model('FailureDay', models.FailureDay);
mongoose.model('GeoTracking', models.GeoTracking);
mongoose.model('GeoFence', models.GeoFence);
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
