var util = require("./util-admin");

/**
 * function to dump the mongodb to the local file system in order to be restored if needed
 *
 * curl -X POST http://localhost:30000/api/entries/dump
 */
exports.dumpTimeEntries = (req, res) => {
    util.dumpTimeEnties()
        .then(response => res.status(200).send(response))
        .catch(err => res.status(500).send('Error while dumping data: ' + err))
};

/**
 * function to backup data in an extra backup table
 * 
 * curl -X POST http://localhost:30000/api/entries/backup
 */
exports.backupTimeEntries = (req, res) => {
    util.backupTimeEntries()
        .then(response => res.status(200).send(response))
        .catch(err => res.status(500).send('Error while backup data: ' + err))
};
