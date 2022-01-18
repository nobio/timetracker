require('../../db');
const fs = require('fs');

const moment = require('moment');
const mongoose = require('mongoose');
const g_util = require('../global_util');

const TimeEntry = mongoose.model('TimeEntry');
const TimeEntryBackup = mongoose.model('TimeEntryBackup');

const DUMP_DIR = './dump';

/**
 * function dump the whole database to a file. This file is located in the "dump" folder
 */
 exports.dumpTimeEntries = async function () {
  try {
    if (!fs.existsSync(DUMP_DIR)) fs.mkdirSync(DUMP_DIR);
    await deleteOldDumpfiles();

    const dumpFile = `${DUMP_DIR}/timeentry_${moment().format('YYYY-MM-DD_HHmmss')}.json`;
    const timeEntries = await TimeEntry.find();

    fs.writeFileSync(dumpFile, JSON.stringify(timeEntries, null, 2), 'UTF8'); // use JSON.stringify for nice format of output
    console.log(`database dump saved ${timeEntries.length} items`);
    return ({
      size: timeEntries.length,
      filename: dumpFile,
    });
  } catch (error) {
    throw error;
  }
};

exports.dumpModel = async (model) => {
  try {
    if (!fs.existsSync(DUMP_DIR)) fs.mkdirSync(DUMP_DIR);
    await deleteOldDumpfiles();

    const dumpFile = `${DUMP_DIR}/${model.modelName}_${moment().format('YYYY-MM-DD_HHmmss')}.json`;
    const entries = await model.find();

    fs.writeFileSync(dumpFile, JSON.stringify(entries, null, 2), 'UTF8'); // use JSON.stringify for nice format of output
    console.log(`database dump saved ${entries.length} items`);
    return ({
      size: entries.length,
      filename: dumpFile,
    });
  } catch (error) {
    throw error;
  }
};
/****************************************************************************

var Potato = mongoose.model('Potato', PotatoSchema);

var potatoBag = [...];

Potato.collection.insert(potatoBag, onInsert);

function onInsert(err, docs) {
    if (err) {
        // TODO: handle error
    } else {
        console.info('%d potatoes were successfully stored.', docs.length);
    }
}
*****************************************************************************/
exports.undumpModel = async (model, filename) => {
  try {
    if (!fs.existsSync(filename)) throw new Error('please provide a path to an exported model JSON file');
    const json = fs.readFileSync(filename);
    console.log(json);

    //console.log(`database dump saved ${entries.length} items`);
    return ({
      //size: entries.length,
      filename: filename,
    });
  } catch (error) {
    throw error;
  }
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
