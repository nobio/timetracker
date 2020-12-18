const util = require('./util-admin');
const utilToggles = require('./util-toggles');
const utilProps = require('./util-properties');

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
  utilToggles.getAllToggles()
    .then(response => res.status(200).send(response))
    .catch(err => res.status(500).send(`Error while reading all toggles: ${err}`));
};

/**
 * read one toggle by its ID
 *
 * curl -X GET http://localhost:30000/api/toggles/5c347688567bd711d5d2c056
 */
exports.getToggleById = (req, res) => {
  const id = req.params.id;

  utilToggles.getToggle(id)
    .then(response => res.status(200).send(response))
    .catch(err => res.status(500).send(`Error while reading one toggle: ${err}`));
};

/**
 * read one toggle by its name
 *
 * curl -X GET http://localhost:30000/api/toggles/name/CREATE_ENTRY
 */
exports.getToggleByName = (req, res) => {
  const name = req.params.name;

  utilToggles.getToggleByName(name)
    .then(response => res.status(200).send(response))
    .catch(err => res.status(500).send(`Error while reading one toggle: ${err}`));
};

/**
 * read the status of toggles; for instance weather or not Slack is used
 *
 * curl -X GET http://localhost:30000/api/toggles/status
 */
exports.getToggleStatus = (req, res) => {
  utilToggles.getToggleStatus()
    .then(response => res.status(200).send(response))
    .catch(err => res.status(500).send(`Error while reading toggle status: ${err}`));
};


/**
 * update the value of a toggle
 *
 * curl -X PUT  -H "Content-Type: application/json" -d '{"toggle":true}' http://localhost:30000/api/toggles/5c347688567bd711d5d2c056
 * curl -X PUT  -H "Content-Type: application/json" -d '{"toggle":false}' http://localhost:30000/api/toggles/5c347688567bd711d5d2c056
 * curl -X PUT  -H "Content-Type: application/json" -d '{"toggle":false, "notification":"test text"}' http://localhost:30000/api/toggles/5c347688567bd711d5d2c056
 */
exports.saveToggle = (req, res) => {
  const id = req.params.id;
  const toggle = req.body.toggle;
  const notification = req.body.notification;

  utilToggles.updateToggle(id, toggle, notification)
    .then(response => res.status(200).send(response))
    .catch(err => res.status(500).send(`Error while saving toggle: ${err}`));
};

/**
 * creates a new toggle with unique name
 *
 * curl -X POST  -H "Content-Type: application/json" -d '{"name":"Create Entry", "toggle":true}' http://localhost:30000/api/toggles
 */
exports.createToggle = (req, res) => {
  const name = req.body.name;
  const toggle = req.body.toggle;
  const notification = req.body.notification;

  utilToggles.createToggle(name, toggle, notification)
    .then(response => res.status(200).send(response))
    .catch(err => res.status(500).send(`Error while creating new toggle: ${err}`));
};


/**
 * deletes one time entry by it's id
 *
 * curl -X DELETE http://localhost:30000/api/toggles/5c347688567bd711d5d2c056
 */
exports.deleteToggle = (req, res) => {
  const id = req.params.id;

  utilToggles.deleteToggle(id)
    .then((toggle) => {
      if (toggle === undefined || toggle === null) {
        res.status(500).send(`Could not delete Toggle with (id: ${id})`);
      } else {
        res.status(200).send(toggle);
      }
    })
    .catch(err => res.status(500).send(`Error while deleting existing toggle: ${err}`));
};

/**
app.get('/api/properties', api_admin.getAllProperties);
app.get('/api/properties/:key', api_admin.getProperty);
app.put('/api/properties/:key', api_admin.setProperty);
app.delete('/api/properties/:key', api_admin.deleteProperty);
 */

/**
 * read all properties
 *
 * curl -X GET http://localhost:30000/api/properties/5c347688567bd711d5d2c056
 */
exports.getProperties = (req, res) => {
  utilProps.getProperties()
    .then(response => res.status(200).send(response))
    .catch(err => res.status(500).send(`Error while reading all properties: ${err}`));
};

/**
 * read a property
 *
 * curl -X GET http://localhost:30000/api/properties/5c347688567bd711d5d2c056
 */
exports.getProperty = (req, res) => {
  const key = req.params.key;

  utilProps.getProperty(key)
    .then(response => {
      if (response) {
        res.status(200).send(response)
      } else {
        res.status(404).send();
      }
    })
    .catch(err => res.status(500).send(`Error while reading one property: ${err}`));
};

/**
 * read a property
 *
 * curl -X GET http://localhost:30000/api/properties/5c347688567bd711d5d2c056
 */
exports.setProperty = (req, res) => {
  const key = req.params.key;
  const value = req.query.value;

  utilProps.setProperty(key, value)
    .then(response => res.status(200).send())
    .catch(err => res.status(500).send(`Error while reading a property: ${err}`));
};

/**
 * read a property
 *
 * curl -X GET http://localhost:30000/api/properties/5c347688567bd711d5d2c056
 */
exports.deleteProperty = (req, res) => {
  const key = req.params.key;

  utilProps.deleteProperty(key)
    .then(response => {
      if (response) {
        res.status(200).send()
      } else {
        res.status(404).send();
      }
    }).catch(err => res.status(500).send(`Error while deleting a property: ${err}`));
};