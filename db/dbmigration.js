#!/usr/local/bin/node
/* eslint-disable no-console */

const mongoose = require('mongoose');

mongoose.set('useUnifiedTopology', true);
mongoose.set('useCreateIndex', true);
mongoose.set('useNewUrlParser', true);

//const MONGO_URL_MLAB = 'mongodb://nobio:1gR7hW2cPhtkRlv2@ds061928.mlab.com:61928/timetrack';
const MONGO_URL_DOCKER = 'mongodb://qnap-nas:27017/timetracker';
//const MONGO_URL_DOCKER = 'mongodb://192.168.178.24:27017/timetracker';
const MONGO_URL_MONGO = 'mongodb+srv://timetracker-user:cyfgeq-mypnu9-vozFyv@nobiocluster.arj0i.mongodb.net/timetrack?retryWrites=true&w=majority';

// const MONGO_URL_SOURCE = MONGO_URL_MLAB;
let targetMongodbUrl = process.env.MONGO_URL; // try to use environment variable, perhaps given by container
if (!targetMongodbUrl) {
  targetMongodbUrl = MONGO_URL_MONGO;
} else if (targetMongodbUrl === 'DOCKER') {
  targetMongodbUrl = MONGO_URL_DOCKER;
} else if (targetMongodbUrl === 'MLAB') {
  targetMongodbUrl = MONGO_URL_MLAB;
} else if (targetMongodbUrl === 'MONGO') {
  targetMongodbUrl = MONGO_URL_MONGO;
}
console.error(`target Mongo database: ${targetMongodbUrl}`);

const MONGO_URL_SOURCE = MONGO_URL_DOCKER;
//const MONGO_URL_TARGET = MONGO_URL_DOCKER;
//const MONGO_URL_TARGET = MONGO_URL_MLAB;
//const MONGO_URL_TARGET = MONGO_URL_MONGO;
const MONGO_URL_TARGET = targetMongodbUrl;

const HELP = process.argv.includes('-h');
const SHOULD_EMPTY_TARGET = !process.argv.includes('-d');
const SILENT = process.argv.includes('-s');
const SUCCESS_ONLY = process.argv.includes('-c');

/* ==================================================================== */
// Schema
const directions = 'enter go'.split(' ');
const TimeEntry = new mongoose.Schema({
  entry_date: { type: Date, required: true, default: Date.now, index: true, },
  direction: { type: String, enum: directions, required: true },
  last_changed: { type: Date, default: Date.now, required: true },
  longitude: { type: Number, required: false },
  latitude: { type: Number, required: false },
});
const GeoTracking = new mongoose.Schema({
  longitude: { type: Number, required: true, index: true },
  latitude: { type: Number, required: true, index: true },
  accuracy: { type: Number, required: false },
  source: { type: String, required: true },
  date: { type: Date, required: true, index: true, unique: true, default: Date.now, },
});
const failureTypes = 'INCOMPLETE,WRONG_ORDER'.split(',');
const FailureDay = new mongoose.Schema({
  date: { type: Date, required: true, index: false, unique: false, },
  failure_type: { type: String, enum: failureTypes, required: true, index: false, unique: false, },
});
const User = new mongoose.Schema({
  username: { type: String, required: true, index: true, unique: true, },
  password: { type: String, required: true, default: false, index: false, },
  name: { type: String, required: true, index: false, unique: false, },
  mailaddress: { type: String, required: true, default: false, index: false, },
});

/* ====================-================================================ */

const connectionSource = mongoose.createConnection(MONGO_URL_SOURCE);
const connectionTarget = mongoose.createConnection(MONGO_URL_TARGET);

const TIME_ENTRY_MODEL_SOURCE = connectionSource.model('TimeEntry', TimeEntry);
const TIME_ENTRY_MODEL_TARGET = connectionTarget.model('TimeEntry', TimeEntry);
const GEO_TRACKING_MODEL_SOURCE = connectionSource.model('GeoTracking', GeoTracking);
const GEO_TRACKING_MODEL_TARGET = connectionTarget.model('GeoTracking', GeoTracking);
const FAILURE_MODEL_SOURCE = connectionSource.model('FailureDay', FailureDay);
const FAILURE_MODEL_TARGET = connectionTarget.model('FailureDay', FailureDay);
const USER_SOURCE = connectionSource.model('User', User);
const USER_TARGET = connectionTarget.model('User', User);

mongoose.model('GeoTracking', GeoTracking);

console.log('--------------------------------------------------------------- \n');
console.log('Usage: [MONGO_URL=MONGO | MLAB ] node db/dbmigration.js [-d] [-s]');
console.log('   -h: display this');
console.log('   -d: emtpy target collection');
console.log('   -s: silent');
console.log('   -c: only success, no errors');
console.log('\n--------------------------------------------------------------- ');

/**
 * Reads data from source data source and returns an json array
 */
async function getDataFromSource(source) {
  try {
    const entries = await source.find();
    console.log(`found ${entries.length} entries`);
    return entries;
  } catch (error) {
    throw new Error(error);
  }
}

async function deleteAllTarget(target) {
  if (SHOULD_EMPTY_TARGET) {
    return 'no delete';
  }
  try {
    console.log('connecting to target database');
    console.log('deleting target data');
    await target.deleteMany({});
  } catch (error) {
    throw new Error(error);
  }

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

const app = async () => {

  try {
    let entries;


    await deleteAllTarget(FAILURE_MODEL_TARGET);
    entries = await getDataFromSource(FAILURE_MODEL_SOURCE);
    await storeDataToTarget(entries, FAILURE_MODEL_TARGET);

    await deleteAllTarget(GEO_TRACKING_MODEL_TARGET);
    entries = await getDataFromSource(GEO_TRACKING_MODEL_SOURCE);
    await storeDataToTarget(entries, GEO_TRACKING_MODEL_TARGET);

    await deleteAllTarget(TIME_ENTRY_MODEL_TARGET);
    entries = await getDataFromSource(TIME_ENTRY_MODEL_SOURCE);
    await storeDataToTarget(entries, TIME_ENTRY_MODEL_TARGET);

    await deleteAllTarget(USER_TARGET);
    entries = await getDataFromSource(USER_SOURCE);
    await storeDataToTarget(entries, USER_TARGET);

    //process.exit(0);

  } catch (err) {
    console.error(err);
    console.error('***********************************************************************');
    process.exit(-1);
  }
};

app();
