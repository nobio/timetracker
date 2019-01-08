const util = require('./util-admin');

/**
 * function to dump the mongodb to the local file system in order to be restored if needed
 *
 * curl -X POST http://localhost:30000/api/entries/dump
 */
exports.dumpTimeEntries = (req, res) => {
  util.dumpTimeEntries()
    .then(response => res.status(200).send(response))
    .catch(err => res.status(500).send(`Error while dumping data: ${err}`));
};

/**
 * function to backup data in an extra backup table
 *
 * curl -X POST http://localhost:30000/api/entries/backup
 */
exports.backupTimeEntries = (req, res) => {
  util.backupTimeEntries()
    .then(response => res.status(200).send(response))
    .catch(err => res.status(500).send(`Error while backup data: ${err}`));
};

/**
 * read the list of all toggles
 * 
 * curl -X GET http://localhost:30000/api/toggles
 */
exports.getAllToggles = (req, res) => {}

/**
 * read one toggle by its ID
 * 
 * curl -X GET http://localhost:30000/api/toggles/1234567890
 */
exports.getToggleById = (req, res) => {}

/**
 * update the value of a toggle
 * 
 * curl -X PUT  -H "Content-Type: application/json" -d '{"toggle":true}' http://localhost:30000/api/toggles/1234567890
 * curl -X PUT  -H "Content-Type: application/json" -d '{"toggle":false}' http://localhost:30000/api/toggles/1234567890
 */
exports.saveToggle = (req, res) => {}
