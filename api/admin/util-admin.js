require('../../db');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const moment = require('moment');
const mongoose = require('mongoose');
const g_util = require('../global_util');

const TimeEntry = mongoose.model('TimeEntry');
const TimeEntryBackup = mongoose.model('TimeEntryBackup');

const DUMP_DIR = './dump';

/**
 * function dump the whole database to a file. This file is located in the "dump" folder
 */
exports.dumpModels = async () => {
  res = [];
  try {
    result = await dumpModel(mongoose.model('User'));
    res.push(result);
    result = await dumpModel(mongoose.model('StatsDay'));
    res.push(result);
    result = await dumpModel(mongoose.model('Toggle'));
    res.push(result);
    result = await dumpModel(mongoose.model('Properties'));
    res.push(result);
    result = await dumpModel(mongoose.model('FailureDay'));
    res.push(result);
    result = await dumpModel(mongoose.model('TimeEntry'));
    res.push(result);
    result = await dumpModel(mongoose.model('GeoTracking'));
    res.push(result);

    return res;
  } catch (error) {
    throw error;
  }
};

const dumpModel = async (model) => {
  try {
    if (!fs.existsSync(DUMP_DIR)) fs.mkdirSync(DUMP_DIR);
    await deleteOldDumpfiles();

    const dumpFile = `${DUMP_DIR}/${model.modelName}_${moment().format('YYYY-MM-DD_HHmmss')}.json.gz`;
    const entries = await model.find();

    console.log(`database dump model ${model.modelName} ${entries.length} items`);

    return await new Promise((resolve, reject) => {
      zlib.gzip(JSON.stringify(entries), (err, buffer) => {
        if (err) {
          rejcet(err);
        } else {
          fs.writeFileSync(dumpFile, buffer); // use JSON.stringify for nice format of output
          resolve({
            size: entries.length,
            filename: dumpFile,
          });
        }
      });
    });
  } catch (error) {
    throw error;
  }
};

exports.restoreDataFromFile = async function () {
  if (!fs.existsSync(DUMP_DIR)) return 'dup directory does not exist - restore not possible';
  res = [];

  res.push(restoreFile('User'));
  res.push(restoreFile('StatsDay'));
  res.push(restoreFile('Toggle'));
  res.push(restoreFile('Properties'));
  res.push(restoreFile('FailureDay'));
  res.push(restoreFile('TimeEntry'));
  res.push(restoreFile('GeoTracking'));
  return res;
};

/**
 * restore data of a specific data type
 * @param {*} dbType
 */
const restoreFile = async (dbType) => {
  const f = recentFile(DUMP_DIR, dbType);
  const model = mongoose.model(dbType);

  const data = JSON.parse(fs.readFileSync(`${DUMP_DIR}/${f.file}`));
  for (const item of data) {
    try {
      await new model(item).save();
      console.log(`model ${model.modelName} ${item._id} saved`);
    } catch (error) {
      console.error(error.message);
    }
  }
};

const recentFile = (dir, type) => {
  const files = fs.readdirSync(dir)
    .filter((file) => fs.lstatSync(path.join(dir, file)).isFile())
    .filter((file) => file.startsWith(type))
    .map((file) => ({ file, mtime: fs.lstatSync(path.join(dir, file)).mtime }))
    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

  return files.length ? files[0] : undefined;
};

exports.backupTimeEntries = async function () {
  try {
    await TimeEntryBackup.deleteMany({});
    const timeEntries = await TimeEntry.find();
    console.log(`${timeEntries.length} time entries found to be backed up`);

    for (const timeentry of timeEntries) {
      new TimeEntryBackup({
        _id: timeentry._id,
        entry_date: timeentry.entry_date,
        direction: timeentry.direction,
        last_changed: timeentry.last_changed,
        longitude: timeentry.longitude,
        latitude: timeentry.latitude,
      }).save();
    }
    g_util.sendMessage('BACKUP_DB');
    return { backup_count: timeEntries.length };
  } catch (error) {
    throw error;
  }
};

/**
 * deletes files in DUMP_DIR which are older than 31 days regarding their file name:
 * 'timeentry_<YYYY-MM-DD_HHmmss>.json'
 */
async function deleteOldDumpfiles() {
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
}
