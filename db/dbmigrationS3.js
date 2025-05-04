#!/usr/local/bin/node
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-param-reassign */
/* eslint-disable no-unused-vars */

require('dotenv').config();
const logger = require('../api/config/logger'); // Logger configuration
const Axios = require('axios');
const mongoose = require('mongoose');
const models = require('./models');

const MONGO_URL_ATLAS = 'mongodb+srv://timetracker-user:cyfgeq-mypnu9-vozFyv@nobiocluster.arj0i.mongodb.net/timetrack?retryWrites=true&w=majority';
const API_BASE_URL_HETZNER = 'https://nobio.myhome-server.de';
const API_URL_HETZNER = `${API_BASE_URL_HETZNER}/api/entries/dump`;
const API_URL_HETZNER_LOGIN = `${API_BASE_URL_HETZNER}/api/auth/login/`;
const API_URL_HETZNER_LOGOUT = `${API_BASE_URL_HETZNER}/api/auth/logout/`;

const MONGO_URL_TARGET = MONGO_URL_ATLAS;

console.info(`\n>> source ${API_URL_HETZNER}\n>> target database: ${MONGO_URL_ATLAS}\n`);

const connectionTarget = mongoose.createConnection(MONGO_URL_TARGET);

const TIME_ENTRY_MODEL_SOURCE = `${API_URL_HETZNER}/TimeEntry`;
const TIME_ENTRY_MODEL_TARGET = connectionTarget.model('TimeEntry', models.TimeEntry);
const STATSDAY_MODEL_SOURCE = `${API_URL_HETZNER}/StatsDay`;
const STATSDAY_MODEL_TARGET = connectionTarget.model('StatsDay', models.StatsDay);
const GEO_TRACKING_MODEL_SOURCE = `${API_URL_HETZNER}/GeoTracking`;
const GEO_TRACKING_MODEL_TARGET = connectionTarget.model('GeoTracking', models.GeoTracking);
const GEO_FENCE_MODEL_SOURCE = `${API_URL_HETZNER}/GeoFence`;
const GEO_FENCE_MODEL_TARGET = connectionTarget.model('GeoFence', models.GeoFence);
const FAILURE_MODEL_SOURCE = `${API_URL_HETZNER}/FailureDay`;
const FAILURE_MODEL_TARGET = connectionTarget.model('FailureDay', models.FailureDay);
const USER_SOURCE = `${API_URL_HETZNER}/User`;
const USER_TARGET = connectionTarget.model('User', models.User);
const TOGGLE_SOURCE = `${API_URL_HETZNER}/Toggle`;
const TOGGLE_TARGET = connectionTarget.model('Toggle', models.Toggle);
const PROPS_SOURCE = `${API_URL_HETZNER}/Properties`;
const PROPS_TARGET = connectionTarget.model('Properties', models.Properties);

let accessToken;

logger.info('--------------------------------------------------------------- \n');
logger.info('Backing up data');
logger.info('\n--------------------------------------------------------------- ');

/**
 * Reads data from source data source (i.e. url) and returns an json array
 */
async function getDataFromSource(sourceUrl, model) {
  try {
    logger.info(`reading entries of <${sourceUrl}> from source`);
    const response = await Axios.get(sourceUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    return response.data.map((item) => {
      // problem: all values in JSON are of type "String" => _id will be deleted so it generates an ObjectId and dates must be added as date
      // 1. delete _id
      delete item._id;
      Object.keys(item).forEach((fieldName) => {
        // speacial treatment of Date fields: String -> Date
        if (model.schema.path(fieldName) instanceof mongoose.Schema.Types.Date) {
          item[fieldName] = new Date(item[fieldName]);
        }
      });
      return item;
    });
  } catch (error) {
    throw new Error(error);
  }
}

const deleteTarget = async (targetModel) => {
  try {
    logger.info('connecting to target database');
    logger.info(`deleting target data of ${targetModel.modelName} in target`);
    await targetModel.deleteMany({});
    return `all data deleted from ${targetModel}`;
  } catch (error) {
    throw new Error(error);
  }
};

/**
 * Stores the data to target data srouce read from source data source
 *
 * @param {entries} entries
 */
const storeDataToTarget = async (entries, targetModel) => {
  logger.info(entries.length, targetModel.modelName);
  try {
    const r = await targetModel.collection.insertMany(entries);
    logger.info(`success = ${r.acknowledged} in ${targetModel.modelName}`);
  } catch (error) {
    logger.error(error.message);
  }

  mongoose.connection.close();
  return (`${entries.length} elements saved`);
};

const app = async () => {
  try {
    // login to API
    //* curl -X POST -H "Content-Type: application/json" -d '{"username": "Tester", "password": "test12345"}' http://localhost:30000/api/users/login

    const loginResponse = await Axios.post(
      API_URL_HETZNER_LOGIN,
      {
        username: 'db-migration',
        password: 'sk9(suB334#?s2',
      },
      { headers: 'Content-Type: application/json' },
    );
    accessToken = loginResponse.data.accessToken;

    console.time('backup User');
    await deleteTarget(USER_TARGET);
    await storeDataToTarget(await getDataFromSource(USER_SOURCE, USER_TARGET), USER_TARGET);
    console.timeEnd('backup User'); process.stdout.write('\n');

    console.time('failures');
    await deleteTarget(FAILURE_MODEL_TARGET);
    await storeDataToTarget(await getDataFromSource(FAILURE_MODEL_SOURCE, FAILURE_MODEL_TARGET), FAILURE_MODEL_TARGET);
    console.timeEnd('failures'); process.stdout.write('\n');

    console.time('toggles');
    await deleteTarget(TOGGLE_TARGET);
    await storeDataToTarget(await getDataFromSource(TOGGLE_SOURCE, TOGGLE_TARGET), TOGGLE_TARGET);
    console.timeEnd('toggles'); process.stdout.write('\n');

    console.time('properties');
    await deleteTarget(PROPS_TARGET);
    await storeDataToTarget(await getDataFromSource(PROPS_SOURCE, PROPS_TARGET), PROPS_TARGET);
    console.timeEnd('properties'); process.stdout.write('\n');

    console.time('system status');
    await deleteTarget(STATSDAY_MODEL_TARGET);
    await storeDataToTarget(await getDataFromSource(STATSDAY_MODEL_SOURCE, STATSDAY_MODEL_TARGET), STATSDAY_MODEL_TARGET);
    console.timeEnd('system status'); process.stdout.write('\n');

    console.time('geofences');
    await deleteTarget(GEO_FENCE_MODEL_TARGET);
    await storeDataToTarget(await getDataFromSource(GEO_FENCE_MODEL_SOURCE, GEO_FENCE_MODEL_TARGET), GEO_FENCE_MODEL_TARGET);
    console.timeEnd('geofences'); process.stdout.write('\n');

    console.time('time entries');
    await deleteTarget(TIME_ENTRY_MODEL_TARGET);
    await storeDataToTarget(await getDataFromSource(TIME_ENTRY_MODEL_SOURCE, TIME_ENTRY_MODEL_TARGET), TIME_ENTRY_MODEL_TARGET);
    console.timeEnd('time entries'); process.stdout.write('\n');

    console.time('geo tracking');
    await deleteTarget(GEO_TRACKING_MODEL_TARGET);
    await storeDataToTarget(await getDataFromSource(GEO_TRACKING_MODEL_SOURCE, GEO_TRACKING_MODEL_TARGET), GEO_TRACKING_MODEL_TARGET);
    console.timeEnd('geo tracking'); process.stdout.write('\n');
  } catch (err) {
    logger.error(err);
    logger.error('***********************************************************************');
  } finally {
    await Axios.post(
      API_URL_HETZNER_LOGOUT,
      {
        token: accessToken,
      },
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );
    process.exit(-1);
  }
};
logger.info(`backup from '${API_URL_HETZNER}' to '${MONGO_URL_TARGET}'`);
app();
/*
commander
  .version('2.0.0')
  .usage('[npm run backup] or [node db/dbmigration] [OPTIONS]')
  .option('-f, --force', 'run without asking')
  .parse(process.argv);

const options = commander.opts();
if (options.force) {
  (async () => {
    console.time('Complete-Backup');
    await app();
    console.timeEnd('Complete-Backup');
  })().catch(console.error);
} else {
  readline.question('Continue? (hit <y> or <enter> to continue or any other key to abort > ', (cont) => {
    if (cont === '' || cont === 'y' || cont === 'Y') app();
    else process.exit(0);

    readline.close();
  });
}
*/
