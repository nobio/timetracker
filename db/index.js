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
let mongodbUrl;
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;

if (process.env.MONGODB_URL) {
  mongodbUrl = process.env.MONGODB_URL;
} else if(process.env.MONGODB_USER && process.env.MONGODB_PASSWORD && process.env.MONGODB_URI) {
  mongodbUrl = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_URI}`;
} else {
  console.log(`error configuring database: please provide env variables MONGODB_USER (${process.env.MONGODB_USER}) and MONGODB_PASSWORD (${process.env.MONGODB_PASSWORD}) and MONGODB_URI (${process.env.MONGODB_URI})`);
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
