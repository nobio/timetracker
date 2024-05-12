#!/usr/local/bin/node
/* eslint-disable no-console */
const commander = require('commander');
const mongoose = require('mongoose');
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout,
});
const models = require('./models');

// mongoose.set('useUnifiedTopology', true);
// mongoose.set('useCreateIndex', true);
// mongoose.set('useNewUrlParser', true);

// const MONGO_URL_QNAP = 'mongodb://qnap-nas:27017/timetracker';
const MONGO_URL_QNAP = 'mongodb://192.168.178.23:27017/timetracker';
const MONGO_URL_ATLAS = 'mongodb+srv://timetracker-user:cyfgeq-mypnu9-vozFyv@nobiocluster.arj0i.mongodb.net/timetrack?retryWrites=true&w=majority';
const MONGO_URL_K8S = 'mongodb://mongouser:mongopassword@192.168.64.2:30001';
const MONGO_URL_HETZNER = 'mongodb://88.198.110.159:27017/timetracker';

// const MONGO_URL_SOURCE = MONGO_URL_QNAP;
const MONGO_URL_SOURCE = MONGO_URL_HETZNER;
// const MONGO_URL_TARGET = MONGO_URL_K8S;
const MONGO_URL_TARGET = MONGO_URL_ATLAS;
// const MONGO_URL_TARGET = MONGO_URL_HETZNER;


console.info(`\n>> source database: ${MONGO_URL_SOURCE}\n>> target database: ${MONGO_URL_TARGET}\n`);

const connectionSource = mongoose.createConnection(MONGO_URL_SOURCE);
const connectionTarget = mongoose.createConnection(MONGO_URL_TARGET);

const TIME_ENTRY_MODEL_SOURCE = connectionSource.model('TimeEntry', models.TimeEntry);
const TIME_ENTRY_MODEL_TARGET = connectionTarget.model('TimeEntry', models.TimeEntry);
const STATSDAY_MODEL_SOURCE = connectionSource.model('StatsDay', models.StatsDay);
const STATSDAY_MODEL_TARGET = connectionTarget.model('StatsDay', models.StatsDay);
const GEO_TRACKING_MODEL_SOURCE = connectionSource.model('GeoTracking', models.GeoTracking);
const GEO_TRACKING_MODEL_TARGET = connectionTarget.model('GeoTracking', models.GeoTracking);
const GEO_FENCE_MODEL_SOURCE = connectionSource.model('GeoFence', models.GeoFence);
const GEO_FENCE_MODEL_TARGET = connectionTarget.model('GeoFence', models.GeoFence);
const FAILURE_MODEL_SOURCE = connectionSource.model('FailureDay', models.FailureDay);
const FAILURE_MODEL_TARGET = connectionTarget.model('FailureDay', models.FailureDay);
const USER_SOURCE = connectionSource.model('User', models.User);
const USER_TARGET = connectionTarget.model('User', models.User);
const TOGGLE_SOURCE = connectionSource.model('Toggle', models.Toggle);
const TOGGLE_TARGET = connectionTarget.model('Toggle', models.Toggle);
const PROPS_SOURCE = connectionSource.model('Properties', models.Properties);
const PROPS_TARGET = connectionTarget.model('Properties', models.Properties);
const TOKEN_SOURCE = connectionSource.model('Token', models.Token);
const TOKEN_TARGET = connectionTarget.model('Token', models.Token);

console.log('--------------------------------------------------------------- \n');
console.log('Backing up mongodb');
console.log('\n--------------------------------------------------------------- ');

/**
 * Reads data from source data source and returns an json array
 */
async function getDataFromSource(source) {
  try {
    console.log(`reading entries of <${source.modelName}> from source`);
    const entries = await source.find();
    console.log(`found ${entries.length} entries of <${source.modelName}> in source`);
    return entries;
  } catch (error) {
    throw new Error(error);
  }
}

const deleteTarget = async (target) => {
  try {
    console.log('connecting to target database');
    console.log(`deleting target data of ${target.modelName} in target`);
    await target.deleteMany({});
    return `all data deleted from ${target}`;
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * Stores the data to target data srouce read from source data source
 *
 * @param {entries} entries
 */
const storeDataToTarget = async (entries, target) => {
  console.log(entries.length, target.modelName);
  try {
    const r = await target.collection.insertMany(entries);
    console.log(`success = ${r.acknowledged} in ${target.modelName}`);
  } catch (error) {
    console.error(error.message);
  }

  mongoose.connection.close();
  return (`${entries.length} elements saved`);
};

const app = async () => {
  try {
    console.time('backup User');
    await deleteTarget(USER_TARGET);
    await storeDataToTarget(await getDataFromSource(USER_SOURCE), USER_TARGET);
    console.timeEnd('backup User'); process.stdout.write('\n');

    console.time('failures');
    await deleteTarget(FAILURE_MODEL_TARGET);
    await storeDataToTarget(await getDataFromSource(FAILURE_MODEL_SOURCE), FAILURE_MODEL_TARGET);
    console.timeEnd('failures'); process.stdout.write('\n');

    console.time('toggles');
    await deleteTarget(TOGGLE_TARGET);
    await storeDataToTarget(await getDataFromSource(TOGGLE_SOURCE), TOGGLE_TARGET);
    console.timeEnd('toggles'); process.stdout.write('\n');

    console.time('token');
    await deleteTarget(TOKEN_TARGET);
    await storeDataToTarget(await getDataFromSource(TOKEN_SOURCE), TOKEN_TARGET);
    console.timeEnd('token'); process.stdout.write('\n');

    console.time('properties');
    await deleteTarget(PROPS_TARGET);
    await storeDataToTarget(await getDataFromSource(PROPS_SOURCE), PROPS_TARGET);
    console.timeEnd('properties'); process.stdout.write('\n');

    console.time('system status');
    await deleteTarget(STATSDAY_MODEL_TARGET);
    await storeDataToTarget(await getDataFromSource(STATSDAY_MODEL_SOURCE), STATSDAY_MODEL_TARGET);
    console.timeEnd('system status'); process.stdout.write('\n');

    console.time('geofences');
    await deleteTarget(GEO_FENCE_MODEL_TARGET);
    await storeDataToTarget(await getDataFromSource(GEO_FENCE_MODEL_SOURCE), GEO_FENCE_MODEL_TARGET);
    console.timeEnd('geofences'); process.stdout.write('\n');

    console.time('time entries');
    await deleteTarget(TIME_ENTRY_MODEL_TARGET);
    await storeDataToTarget(await getDataFromSource(TIME_ENTRY_MODEL_SOURCE), TIME_ENTRY_MODEL_TARGET);
    console.timeEnd('time entries'); process.stdout.write('\n');

    console.time('geo tracking');
    await deleteTarget(GEO_TRACKING_MODEL_TARGET);
    await storeDataToTarget(await getDataFromSource(GEO_TRACKING_MODEL_SOURCE), GEO_TRACKING_MODEL_TARGET);
    console.timeEnd('geo tracking'); process.stdout.write('\n');

    process.exit(0);
  } catch (err) {
    console.error(err);
    console.error('***********************************************************************');
    process.exit(-1);
  }
};
console.log(`backup from '${MONGO_URL_SOURCE}' to '${MONGO_URL_TARGET}'`);

commander
  .version('2.0.0')
  .usage('[npm run backup] or [node db/dbmigration] [OPTIONS]')
  .option('-f, --force', 'run without asking')
  .parse(process.argv);

const options = commander.opts();

if (options.force) {
  app();
} else {
  readline.question('Continue? (hit <y> or <enter> to continue or any other key to abort > ', (cont) => {
    if (cont === '' || cont === 'y' || cont === 'Y') app();
    else process.exit(0);

    readline.close();
  });
}
