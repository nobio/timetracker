/* eslint-disable no-await-in-loop */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-restricted-syntax */
require('../../db');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const moment = require('moment');
const mongoose = require('mongoose');
const gUtil = require('../global_util');

const TimeEntry = mongoose.model('TimeEntry');
const TimeEntryBackup = mongoose.model('TimeEntryBackup');

const DUMP_DIR = './dump';
const MODELS = ['User', 'StatsDay', 'Toggle', 'Properties', 'GeoFence', 'FailureDay', 'TimeEntry', 'GeoTracking'];

/* ====================================================================================== */
/* ======================================== H E L P E R ================================= */
/* ====================================================================================== */

/**
 * deletes files in DUMP_DIR which are older than 31 days regarding their file name:
 * 'timeentry_<YYYY-MM-DD_HHmmss>.json'
 */
const deleteOldDumpfiles = async () => {
  if (fs.existsSync(DUMP_DIR)) {
    const fileNames = await fs.readdirSync(DUMP_DIR);

    for (const fileName of fileNames) {
      const fileDate = moment(fileName.split('.')[0].split('_')[1]);
      const diffDays = Math.round(moment().diff(fileDate) / 86400000) - 1;
      if (diffDays > 31) {
        fs.rmSync(`${DUMP_DIR}/${fileName}`);
      }
    }
  }
};

/**
 * dumps one model
 * @param {*} model
 * @returns
 */
const dumpModel = async (model) => {
  if (!fs.existsSync(DUMP_DIR)) fs.mkdirSync(DUMP_DIR);
  await deleteOldDumpfiles();

  const dumpFile = `${DUMP_DIR}/${model.modelName}_${moment().format('YYYY-MM-DD_HHmmss')}.json.gz`;
  const entries = await model.find();

  console.log(`database dump model ${model.modelName} ${entries.length} items`);

  return new Promise((resolve, reject) => {
    zlib.gzip(JSON.stringify(entries), (err, buffer) => {
      if (err) reject(err);
      else {
        fs.writeFileSync(dumpFile, buffer); // use JSON.stringify for nice format of output
        resolve({
          size: entries.length,
          filename: dumpFile,
        });
      }
    });
  });
};

/**
 * returns the latest file of a typ within a directory
 */
const recentFile = (dir, type) => {
  const files = fs.readdirSync(dir)
    .filter((file) => fs.lstatSync(path.join(dir, file)).isFile())
    .filter((file) => file.startsWith(type))
    .map((file) => ({ file, mtime: fs.lstatSync(path.join(dir, file)).mtime }))
    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

  return files.length ? files[0] : undefined;
};

/**
 * restore data of a specific data type
 * @param {*} dbType
 */
const restoreFile = async (dbType) => {
  const f = recentFile(DUMP_DIR, dbType);
  const Model = mongoose.model(dbType);
  const buffer = fs.readFileSync(`${DUMP_DIR}/${f.file}`);
  const data = await new Promise((resolve, reject) => {
    zlib.gunzip(buffer, (err, buf) => {
      if (err) reject(err);
      else resolve(JSON.parse(buf.toString('utf-8')));
    });
  });
  // const data = JSON.parse(fs.readFileSync(`${DUMP_DIR}/${f.file}`));
  // eslint-disable-next-line no-restricted-syntax
  await Model.deleteMany({});
  for (const item of data) {
    try {
      new Model(item).save();
      console.log(`model ${Model.modelName} ${item._id} saved`);
    } catch (error) {
      console.error(error.message);
    }
  }
};

/* ====================================================================================== */
/* ======================================== IMPL ================================= */
/* ====================================================================================== */

/**
 * function dump the whole database to a file. This file is located in the "dump" folder
 */
exports.dumpModels = async () => {
  const res = [];
  for (const model of MODELS) {
    res.push(await dumpModel(mongoose.model(model)));
  }
  return res;
};

exports.restoreDataFromFile = async () => {
  if (!fs.existsSync(DUMP_DIR)) fs.mkdirSync(DUMP_DIR);

  const res = [];
  for (const model of MODELS) {
    res.push(await restoreFile(model));
  }

  return res;
};

exports.backupTimeEntries = async () => {
  console.log('------------------- BACKUP DATA TO BACKUP TABLE ---------------------');
  await TimeEntryBackup.deleteMany({});
  const timeEntries = await TimeEntry.find();
  console.log(`${timeEntries.length} time entries found to be backed up`);

  const promises = [];
  for (const timeentry of timeEntries) {
    promises.push(
      new TimeEntryBackup({
        _id: timeentry._id,
        entry_date: timeentry.entry_date,
        direction: timeentry.direction,
        last_changed: timeentry.last_changed,
        longitude: timeentry.longitude,
        latitude: timeentry.latitude,
      }).save(),
    );
  }

  try {
    const values = await Promise.all(promises);
    console.log(values.length);
    gUtil.sendMessage('BACKUP_DB');
    return { backup_count: timeEntries.length };
  } catch (error) {
    console.error(error);
  }
};
