#!/usr/local/bin/node
/* eslint-disable no-console */

const mongoose = require('mongoose');
const models = require('./models');

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

const connectionSource = mongoose.createConnection(MONGO_URL_SOURCE);
const connectionTarget = mongoose.createConnection(MONGO_URL_TARGET);

const TIME_ENTRY_MODEL_SOURCE = connectionSource.model('TimeEntry', models.TimeEntry);
const TIME_ENTRY_MODEL_TARGET = connectionTarget.model('TimeEntry', models.TimeEntry);
const GEO_TRACKING_MODEL_SOURCE = connectionSource.model('GeoTracking', models.GeoTracking);
const GEO_TRACKING_MODEL_TARGET = connectionTarget.model('GeoTracking', models.GeoTracking);
const FAILURE_MODEL_SOURCE = connectionSource.model('FailureDay', models.FailureDay);
const FAILURE_MODEL_TARGET = connectionTarget.model('FailureDay', models.FailureDay);
const USER_SOURCE = connectionSource.model('User', models.User);
const USER_TARGET = connectionTarget.model('User', models.User);
const TOGGLE_SOURCE = connectionSource.model('Toggle', models.Toggle);
const TOGGLE_TARGET = connectionTarget.model('Toggle', models.Toggle);
const PROPS_SOURCE = connectionSource.model('Properties', models.Properties);
const PROPS_TARGET = connectionTarget.model('Properties', models.Properties);

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
    console.log(`found ${entries.length} entries in <${source.modelName}>`);
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
async function storeDataToTarget(entries, target) {
  for (const entry of entries) {
    process.stdout.write('.');
    // console.log(Object.keys(TIME_ENTRY_MODEL_TARGET.schema.tree))
    const t = new target();
    Object.keys(target.schema.tree).forEach((element) => {
      t[element] = entry[element];
    });
    try {
      await t.save();
      // eslint-disable-next-line no-underscore-dangle
      console.log(`saved: ${target.modelName} - ObjectId('${entry._id}')`);
    } catch (error) {
      if (!SILENT && !SUCCESS_ONLY) console.error(`> ${error.message}`);
    }
  };
  process.stdout.write(`\n`);
  mongoose.connection.close();
  return (`${entries.length} elements saved`);
}

if (HELP) process.exit(0);

const app = async () => {

  try {

    await deleteAllTarget(FAILURE_MODEL_TARGET);
    await storeDataToTarget(await getDataFromSource(FAILURE_MODEL_SOURCE), FAILURE_MODEL_TARGET);

    await deleteAllTarget(USER_TARGET);
    await storeDataToTarget(await getDataFromSource(USER_SOURCE), USER_TARGET);

    await deleteAllTarget(TOGGLE_TARGET);
    await storeDataToTarget(await getDataFromSource(TOGGLE_SOURCE), TOGGLE_TARGET);

    await deleteAllTarget(PROPS_TARGET);
    await storeDataToTarget(await getDataFromSource(PROPS_SOURCE), PROPS_TARGET);

    await deleteAllTarget(GEO_TRACKING_MODEL_TARGET);
    await storeDataToTarget(await getDataFromSource(GEO_TRACKING_MODEL_SOURCE), GEO_TRACKING_MODEL_TARGET);

    await deleteAllTarget(TIME_ENTRY_MODEL_TARGET);
    await storeDataToTarget(await getDataFromSource(TIME_ENTRY_MODEL_SOURCE), TIME_ENTRY_MODEL_TARGET);

    process.exit(0);

  } catch (err) {
    console.error(err);
    console.error('***********************************************************************');
    process.exit(-1);
  }
};

app();
