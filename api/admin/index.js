const util = require('./util-admin');
const utilToggles = require('./util-toggles');
const utilProps = require('./util-properties');
const utilGeofence = require('./util-geofences');
const utilMinio = require('./util-minio');
const { Tracer } = require('../tracing/Tracer');

/**
 * function to dump the mongodb to the local file system in order to be restored if needed
 *
 * curl -X POST http://localhost:30000/api/entries/dump
 */
exports.dumpModels = (req, res) => {
  const span = Tracer.startSpan('admin.dumpModels');

  if (process.env.MINIO_ACTIVE === 'true') {
    // dump to S3-Storage
    utilMinio.dumpModels()
      .then((response) => res.status(200).send(response))
      .catch((err) => res.status(500).send(`Error while dumping data: ${err}`))
      .finally(() => span.end());
  } else {
    // dump to file system
    util.dumpModels()
      .then((response) => res.status(200).send(response))
      .catch((err) => res.status(500).send(`Error while dumping data: ${err}`))
      .finally(() => span.end());
  }
};

/**
 * restores data from lastest written file, exported by dumModels method
 *
 * curl -k -X POST https://localhost:30443/api/entries/restore
 */
exports.restore = (req, res) => {
  const span = Tracer.startSpan('admin.restoreFromFile');

  if (process.env.MINIO_ACTIVE === 'true') {
    // dump to S3-Storage
    utilMinio.restoreFromS3()
      .then((response) => res.status(200).send(response))
      .catch((err) => res.status(500).send(`Error while restoring data: ${err}`))
      .finally(() => span.end());
  } else {
    // dump to file system
    util.restoreDataFromFile()
      .then((response) => res.status(200).send(response))
      .catch((err) => res.status(500).send(`Error while restoring data: ${err}`))
      .finally(() => span.end());
  }
};

/**
   * function to backup data in an extra backup table
   *
   * curl -X POST http://localhost:30000/api/entries/backup
   */
exports.backupTimeEntries = (req, res) => {
  const span = Tracer.startSpan('admin.backupTimeEntries');

  util.backupTimeEntries()
    .then((response) => res.status(200).send(response))
    .catch((err) => res.status(500).send(`Error while backup data: ${err}`))
    .finally(() => span.end());
};

/**
 * read the list of all toggles
 *
 * curl -X GET http://localhost:30000/api/toggles
 */
exports.getAllToggles = (req, res) => {
  const span = Tracer.startSpan('admin.getAllToggles');

  utilToggles.getAllToggles()
    .then((response) => res.status(200).send(response))
    .catch((err) => res.status(500).send(`Error while reading all toggles: ${err}`))
    .finally(() => span.end());
};

/**
 * read one toggle by its ID
 *
 * curl -X GET http://localhost:30000/api/toggles/5c347688567bd711d5d2c056
 */
exports.getToggleById = (req, res) => {
  const span = Tracer.startSpan('admin.getToggleById');
  const { id } = req.params;

  utilToggles.getToggle(id)
    .then((response) => res.status(200).send(response))
    .catch((err) => res.status(500).send(`Error while reading one toggle: ${err}`))
    .finally(() => span.end());
};

/**
 * read one toggle by its name
 *
 * curl -X GET http://localhost:30000/api/toggles/name/CREATE_ENTRY
 */
exports.getToggleByName = (req, res) => {
  const { name } = req.params;
  const span = Tracer.startSpan('admin.getToggleByName');
  if (span.isRecording()) { span.setAttribute('name', name); }

  utilToggles.getToggleByName(name)
    .then((response) => res.status(200).send(response))
    .catch((err) => res.status(500).send(`Error while reading one toggle: ${err}`))
    .finally(() => span.end());
};

/**
 * read the status of toggles; for instance weather or not Slack is used
 *
 * curl -X GET http://localhost:30000/api/toggles/status
 */
exports.getToggleStatus = (req, res) => {
  const span = Tracer.startSpan('admin.getToggleStatus');

  utilToggles.getToggleStatus()
    .then((response) => res.status(200).send(response))
    .catch((err) => res.status(500).send(`Error while reading toggle status: ${err}`))
    .finally(() => span.end());
};

/**
 * update the value of a toggle
 *
 * curl -X PUT  -H "Content-Type: application/json" -d '{"toggle":true}' http://localhost:30000/api/toggles/5c347688567bd711d5d2c056
 * curl -X PUT  -H "Content-Type: application/json" -d '{"toggle":false}' http://localhost:30000/api/toggles/5c347688567bd711d5d2c056
 * curl -X PUT  -H "Content-Type: application/json" -d '{"toggle":false, "notification":"test text"}' http://localhost:30000/api/toggles/5c347688567bd711d5d2c056
 */
exports.saveToggle = (req, res) => {
  const { id } = req.params;
  const { toggle } = req.body;
  const { notification } = req.body;
  const span = Tracer.startSpan('admin.saveToggle');
  if (span.isRecording()) {
    span.setAttribute('id', id);
    span.setAttribute('toggle', toggle);
    span.setAttribute('notification', notification);
  }

  utilToggles.updateToggle(id, toggle, notification)
    .then((response) => res.status(200).send(response))
    .catch((err) => res.status(500).send(`Error while saving toggle: ${err}`))
    .finally(() => span.end());
};

/**
 * creates a new toggle with unique name
 *
 * curl -X POST  -H "Content-Type: application/json" -d '{"name":"Create Entry", "toggle":true}' http://localhost:30000/api/toggles
 */
exports.createToggle = (req, res) => {
  const { name } = req.body;
  const { toggle } = req.body;
  const { notification } = req.body;
  const span = Tracer.startSpan('admin.createToggle');
  if (span.isRecording()) {
    span.setAttribute('name', name);
    span.setAttribute('toggle', toggle);
    span.setAttribute('notification', notification);
  }

  utilToggles.createToggle(name, toggle, notification)
    .then((response) => res.status(200).send(response))
    .catch((err) => res.status(500).send(`Error while creating new toggle: ${err}`))
    .finally(() => span.end());
};

/**
 * deletes one time entry by it's id
 *
 * curl -X DELETE http://localhost:30000/api/toggles/5c347688567bd711d5d2c056
 */
exports.deleteToggle = (req, res) => {
  const { id } = req.params;
  const span = Tracer.startSpan('admin.deleteToggle');

  utilToggles.deleteToggle(id)
    .then((toggle) => {
      if (toggle === undefined || toggle === null) {
        res.status(500).send(`Could not delete Toggle with (id: ${id})`);
      } else {
        res.status(200).send(toggle);
      }
    })
    .catch((err) => res.status(500).send(`Error while deleting existing toggle: ${err}`))
    .finally(() => span.end());
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
 * curl -X GET http://localhost:30000/api/properties
 */
exports.getProperties = (req, res) => {
  const span = Tracer.startSpan('admin.getProperties');

  utilProps.getProperties()
    .then((response) => res.status(200).send(response))
    .catch((err) => res.status(500).send(`Error while reading all properties: ${err}`))
    .finally(() => span.end());
};

/**
 * read a property
 *
 * curl -X GET http://localhost:30000/api/properties/TEST_KEY01
 */
exports.getProperty = (req, res) => {
  const { key } = req.params;
  const span = Tracer.startSpan('admin.getProperties');
  if (span.isRecording()) { span.setAttribute('key', key); }

  utilProps.getProperty(key)
    .then((response) => {
      if (response) {
        res.status(200).send(response);
      } else {
        res.status(404).send();
      }
    })
    .catch((err) => res.status(500).send(`Error while reading one property: ${err}`))
    .finally(() => span.end());
};

/**
 * set (creat or update) a property
 *
 * curl -X PUT http://localhost:30000/api/properties/TEST_KEY01?value=TEST_VALUE
 */
exports.setProperty = (req, res) => {
  const { key } = req.params;
  const { value } = req.query;
  const span = Tracer.startSpan('admin.setProperty');
  if (span.isRecording()) {
    span.setAttribute('key', key);
    span.setAttribute('value', value);
  }

  utilProps.setProperty(key, value)
    .then((response) => res.status(201).send())
    .catch((err) => res.status(500).send(`Error while reading a property: ${err}`))
    .finally(() => span.end());
};

/**
 * delete a property
 *
 * curl -X DELETE http://localhost:30000/api/properties/TEST_KEY01
 */
exports.deleteProperty = (req, res) => {
  const { key } = req.params;
  const span = Tracer.startSpan('admin.deleteProperty');
  if (span.isRecording()) { span.setAttribute('key', key); }

  utilProps.deleteProperty(key)
    .then((response) => {
      if (response) {
        res.status(204).send();
      } else {
        res.status(404).send();
      }
    }).catch((err) => res.status(500).send(`Error while deleting a property: ${err}`))
    .finally(() => span.end());
};

/** ********************************
app.get('/api/gefences', api_admin.getGeofences);
app.get('/api/gefences/:id', api_admin.getGeofence);
app.post('/api/gefences', api_admin.createGeofence);
app.put('/api/gefences/:id', api_admin.saveGeofence);
app.delete('/api/gefences/:id', api_admin.deleteGeofence);
 */

exports.getGeofences = (req, res) => {
  const span = Tracer.startSpan('admin.getGeofences');

  utilGeofence.getGeofences()
    .then((response) => res.status(200).send(response))
    .catch((err) => res.status(500).send(`Error while reading all geofences: ${err.message}`))
    .finally(() => span.end());
};

exports.getGeofence = (req, res) => {
  const { id } = req.params;
  const span = Tracer.startSpan('admin.getGeofence');
  if (span.isRecording()) { span.setAttribute('id', id); }

  utilGeofence.getGeofence(id)
    .then((response) => res.status(200).send(response))
    .catch((err) => res.status(500).send(`Error while reading a geofence: ${err.message}`))
    .finally(() => span.end());
};

exports.createGeofence = (req, res) => {
  const span = Tracer.startSpan('admin.createGeofence');
  const {
    enabled, longitude, latitude, radius, description, isCheckedIn, lastChange,
  } = req.body;

  utilGeofence.createGeofence(
    enabled,
    longitude,
    latitude,
    radius,
    description,
    isCheckedIn,
    lastChange,
  )
    .then((response) => res.status(200).send(response))
    .catch((err) => res.status(500).send(`Error while creating a new geofence: ${err.message}`))
    .finally(() => span.end());
};

exports.saveGeofence = (req, res) => {
  const { id } = req.params;
  const {
    enabled, longitude, latitude, radius, description, isCheckedIn, lastChange,
  } = req.body;
  const span = Tracer.startSpan('admin.saveGeofence');
  if (span.isRecording()) { span.setAttribute('id', id); }

  utilGeofence.setGeofence(id, enabled, longitude, latitude, radius, description, isCheckedIn, lastChange)
    .then((response) => res.status(200).send(response))
    .catch((err) => res.status(404).send(`Error while updating existing geofence: ${err.message}`))
    .finally(() => span.end());
};

exports.deleteGeofence = (req, res) => {
  const { id } = req.params;
  const span = Tracer.startSpan('admin.deleteGeofence');
  if (span.isRecording()) { span.setAttribute('id', id); }

  utilGeofence.deleteGeofence(id)
    .then((response) => res.status(200).send(response))
    .catch((err) => res.status(500).send(`Error while deleting a geofence: ${err.message}`))
    .finally(() => span.end());
};
