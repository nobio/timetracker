var util = require("./util-admin");

/**
 * function to dump the mongodb to the local file system in order to be restored if needed
 *
 * curl -X POST http://localhost:30000/api/admin/dump/timeentry
 */
exports.dumpTimeEntries = (req, res) => {
    util.dumpTimeEnties()
    .then(response => res.status(200).send(response))
    .catch(err => res.status(500).send('Error while dumping data: ' + err))
};

exports.backupTimeEntries = (req, res) => {
    
}