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
exports.getAllToggles = (req, res) => {
  util.getAllToggles()
    .then(response => res.status(200).send(response))
    .catch(err => res.status(500).send(`Error while reading all toggles: ${err}`));
}

/**
 * read one toggle by its ID
 * 
 * curl -X GET http://localhost:30000/api/toggles/5c347688567bd711d5d2c056
 */
exports.getToggleById = (req, res) => {
  const id = req.params.id;

  util.getToggle(id)
    .then(response => res.status(200).send(response))
    .catch(err => res.status(500).send(`Error while reading one toggle: ${err}`));
}

/**
 * update the value of a toggle
 * 
 * curl -X PUT  -H "Content-Type: application/json" -d '{"toggle":true}' http://localhost:30000/api/toggles/5c347688567bd711d5d2c056
 * curl -X PUT  -H "Content-Type: application/json" -d '{"toggle":false}' http://localhost:30000/api/toggles/5c347688567bd711d5d2c056
 */
exports.saveToggle = (req, res) => {
  const id = req.params.id;
  const toggle = req.body.toggle;

  util.updateToggle(id, toggle)
    .then(response => res.status(200).send(response))
    .catch(err => res.status(500).send(`Error while saving toggle: ${err}`));
}

/**
 * creates a new toggle with unique name
 * 
 * curl -X POST  -H "Content-Type: application/json" -d '{"name":"Create Entry", "toggle":true}' http://localhost:30000/api/toggles
 */
exports.createToggle = (req, res) => {
  const name = req.body.name;
  const toggle = req.body.toggle;

  util.createToggle(name, toggle)
    .then(response => res.status(200).send(response))
    .catch(err => res.status(500).send(`Error while creating new toggle: ${err}`));
}


/**
 * deletes one time entry by it's id
 *
 * curl -X DELETE http://localhost:30000/api/toggles/5c347688567bd711d5d2c056
 */
exports.deleteToggle = (req, res) => {
  const id = req.params.id;

  util.deleteToggle(id)
    .then((toggle) => {
      if (toggle === undefined || toggle === null) {
        res.status(500).send(`Could not delete Toggle with (id: ${id})`)
      } else {
        res.status(200).send(toggle)
      }
    })
    .catch(err => res.status(500).send(`Error while deleting existing toggle: ${err}`));
}
