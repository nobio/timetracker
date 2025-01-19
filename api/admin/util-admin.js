/* eslint-disable no-console */
/* eslint-disable consistent-return */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-underscore-dangle */
/* eslint-disable no-restricted-syntax */
require('../../db');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const moment = require('moment-timezone');
const mongoose = require('mongoose');
const gUtil = require('../global_util');

// Constants
const DUMP_DIR = './dump';
const MODELS = gUtil.MODEL_TYPES;

// Models
const TimeEntry = mongoose.model('TimeEntry');
const TimeEntryBackup = mongoose.model('TimeEntryBackup');

// State
let isBackupRunning = false;
let isDumpRunning = false;

/* ====================================================================================== */
/* ======================================== HELPERS ===================================== */
/* ====================================================================================== */

/**
 * Deletes dump files older than 31 days
 */
const deleteOldDumpfiles = async () => {
  if (!fs.existsSync(DUMP_DIR)) return;

  const fileNames = await fs.readdirSync(DUMP_DIR);

  fileNames.forEach((fileName) => {
    const fileDate = moment(fileName.split('.')[0].split('_')[1]).tz('Europe/Berlin');
    const ageInDays = moment().diff(fileDate, 'days');

    if (ageInDays > 31) {
      fs.rmSync(`${DUMP_DIR}/${fileName}`);
    }
  });
};

/**
 * Dumps a single model to a gzipped JSON file
 */
const dumpModel = async (model) => {
  if (!fs.existsSync(DUMP_DIR)) {
    fs.mkdirSync(DUMP_DIR);
  }

  await deleteOldDumpfiles();

  const timestamp = moment().format('YYYY-MM-DD_HHmmss');
  const dumpFile = `${DUMP_DIR}/${model.modelName}_${timestamp}.json.gz`;
  const entries = await model.find();

  console.log(`Dumping ${model.modelName}: ${entries.length} items`);

  return new Promise((resolve, reject) => {
    zlib.gzip(JSON.stringify(entries), (err, buffer) => {
      if (err) {
        reject(err);
        return;
      }

      fs.writeFileSync(dumpFile, buffer);
      resolve({
        size: entries.length,
        filename: dumpFile,
      });
    });
  });
};

/**
 * Gets the most recent file of a given type from a directory
 */
const getRecentFile = (dir, type) => {
  const files = fs.readdirSync(dir)
    .filter((file) => {
      const stats = fs.lstatSync(path.join(dir, file));
      return stats.isFile() && file.startsWith(type);
    })
    .map((file) => ({
      file,
      mtime: fs.lstatSync(path.join(dir, file)).mtime,
    }))
    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

  return files[0];
};

/**
 * Restores data from a dump file into the database
 */
const restoreFile = async (dbType) => {
  const recentDumpFile = getRecentFile(DUMP_DIR, dbType);
  if (!recentDumpFile) return;

  const Model = mongoose.model(dbType);
  const buffer = fs.readFileSync(`${DUMP_DIR}/${recentDumpFile.file}`);

  const data = await new Promise((resolve, reject) => {
    zlib.gunzip(buffer, (err, buf) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(JSON.parse(buf.toString('utf-8')));
    });
  });

  await Model.deleteMany({});
  await Model.insertMany(data);

  return dbType;
};

/**
 * Downloads and unzips a model's dump file
 */
const downloadObject = async (dbType) => {
  try {
    const recentDumpFile = getRecentFile(DUMP_DIR, dbType);
    if (!recentDumpFile) return;

    const buffer = fs.readFileSync(`${DUMP_DIR}/${recentDumpFile.file}`);

    return await new Promise((resolve, reject) => {
      zlib.gunzip(buffer, (err, buf) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(JSON.parse(buf.toString('utf-8')));
      });
    });
  } catch (error) {
    console.error(error);
    return error.message;
  }
};

/* ====================================================================================== */
/* ======================================== PUBLIC API ================================== */
/* ====================================================================================== */

/**
 * Dumps all models to files
 */
exports.dumpModels = async () => {
  if (isDumpRunning) return;

  console.info('------------------- STARTING DATABASE DUMP ---------------------');
  isDumpRunning = true;

  try {
    const promises = MODELS.map((model) => dumpModel(mongoose.model(model)));
    const results = await Promise.all(promises);
    return results;
  } finally {
    isDumpRunning = false;
    console.info('------------------- DATABASE DUMP COMPLETE ---------------------');
  }
};

/**
 * Restores all models from dump files
 */
exports.restoreDataFromFile = async () => {
  if (!fs.existsSync(DUMP_DIR)) {
    fs.mkdirSync(DUMP_DIR);
  }

  const restoredModels = [];
  for (const model of MODELS) {
    const result = await restoreFile(model);
    if (result) restoredModels.push(result);
  }

  return restoredModels;
};

/**
 * Backs up time entries to a backup collection
 */
exports.backupTimeEntries = async () => {
  if (isBackupRunning) return;

  console.info('------------------- STARTING TIME ENTRY BACKUP ---------------------');
  isBackupRunning = true;

  try {
    await TimeEntryBackup.deleteMany({});
    const timeEntries = await TimeEntry.find();
    console.log(`Found ${timeEntries.length} time entries to backup`);

    const backupPromises = timeEntries.map((entry) => (
      new TimeEntryBackup({
        _id: entry._id,
        entry_date: entry.entry_date,
        direction: entry.direction,
        last_changed: entry.last_changed,
        longitude: entry.longitude,
        latitude: entry.latitude,
      }).save()
    ));

    const results = await Promise.all(backupPromises);
    gUtil.sendMessage('BACKUP_DB');

    return { backup_count: results.length };
  } catch (error) {
    console.error('Backup failed:', error);
    throw error;
  } finally {
    isBackupRunning = false;
    console.info('------------------- TIME ENTRY BACKUP COMPLETE ---------------------');
  }
};

exports.getDumpedModel = async (modelType) => downloadObject(modelType);

// Test helpers
exports.testWrapperDeleteOldDumpfiles = deleteOldDumpfiles;
exports.testWrapperDumpModel = dumpModel;
