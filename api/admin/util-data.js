require('../../db');
const g_util = require('../global_util');
const fs = require('fs');

const mongoose = require('mongoose');
const TimeEntry = mongoose.model('TimeEntry');
const TimeEntryBackup = mongoose.model('TimeEntryBackup');

exports.replicateTimeEntries = () => new Promise((resolve, reject) => {
 resolve('not yet implemented');
});
