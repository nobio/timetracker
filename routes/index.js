const mongoose = require('mongoose');
const moment = require('moment');
const tz = require('moment-timezone');
const util = require('./entries/util-entries');

const TimeEntry = mongoose.model('TimeEntry');

/* ================================================================== */
/* =========================== JADE/HTML ============================ */
/* ================================================================== */

/*
 * calculates the number of entries and renders the index.jade by passing the size
 */
exports.index = (req, res) => {
  util.count()
    .then((size) => {
      res.render('index', {size});
    })
    .catch((err) => {
      console.error(err)
      res.render('index');
    });
};

exports.admin = (req, res) => {
  res.render('admin');
};

exports.admin_item = (req, res) => {
  res.render('admin_item');
  // http://localhost:30000/admin_item?id=537edec991c647b10f4f5a6f
};

exports.stats = (req, res) => {
  res.render('stats');
};

exports.statistics = (req, res) => {
  res.render('statistics');
};

exports.geoloc = (req, res) => {
  res.render('geoloc');
};

/* ================================================================== */
/* ============================== REST ============================== */
/* ================================================================== */

/*
  {
    device: '0C799CAD-D148-4F05-94EA-A74086AA91E3',
    id: 'Work',
    latitude: '49.51429653451733',
    longitude: '10.87531216443598',
    timestamp: '1401728167.886038',
    trigger: 'exit'
 }
 {
    device: '0C799CAD-D148-4F05-94EA-A74086AA91E3',
    id: 'Work',
    latitude: '49.51429653451733',
    longitude: '10.87531216443598',
    timestamp: '1401729237.592610',
    trigger: 'enter'
 }
 *
 * curl -X POST -H "Content-Type: application/json" -d '{"device": "0C799CAD-D148-4F05-94EA-A74086AA91E3", "id": "Work", "latitude": "49.51429653451733", "longitude": "10.87531216443598", "timestamp": "1401728167.886038", "trigger": "enter"}' http://localhost:30000/geofence
 * curl -X POST -H "Content-Type: application/json" -d '{"device": "0C799CAD-D148-4F05-94EA-A74086AA91E3", "id": "Home", "latitude": "49.51429653451733", "longitude": "10.87531216443598", "timestamp": "1401728167.886038", "trigger": "enter"}' http://localhost:30000/geofence

Work:
{ device: '4AB9FC83-510B-4FFD-9EBE-5051E4F5EA57',
  device_model: 'iPhone7,2',
  device_type: 'iOS',
  id: 'Work',
  latitude: '49.448335',
  longitude: '11.091801',
  timestamp: '1477582315.800965',
  trigger: 'exit‘
}
 */
exports.geofence = (req, res) => {
  console.log(JSON.stringify(req.body));
  const direction = (req.body.trigger == 'enter' ? 'enter' : 'go');
  if (req.body.id === 'Work') {
    const timeEntry = {
      direction,
      datetime: moment(),
      longitude: req.body.longitude,
      latitude: req.body.latitude,
    };

    util.create(timeEntry)
      .then(timeentry => res.status(200).send(timeentry))
      .catch(err => res.status(500).send(`Error while createing a new Time Entry: ${err.message}`));
  } else {
    res.send({
      message: 'no geofence entry made; id must be Work)',
    });
  }
};

/**
 * Is supposed to receives a location object
 * BackgroundGeolocationResponse

Param	Type	Details
locationId	number
ID of location as stored in DB (or null)
serviceProvider	string
Service provider
debug	boolean
true if location recorded as part of debug
time	number
UTC time of this fix, in milliseconds since January 1, 1970.
latitude	number
latitude, in degrees.
longitude	number
longitude, in degrees.
accuracy	number
estimated accuracy of this location, in meters.
speed	number
speed if it is available, in meters/second over ground.
altitude	number
altitude if available, in meters above the WGS 84 reference ellipsoid.
altitudeAccuracy	number
accuracy of the altitude if available.
bearing	number
bearing, in degrees.
coords	Coordinates
A Coordinates object defining the current location
timestamp	number
A timestamp representing the time at which the location was retrieved.

curl -X POST -H "Content-Type: application/json" -d '{"locationId": "0C799CAD-D148-4F05-94EA-A74086AA91E3", "id": "Work", "latitude": "49.51429653451733", "longitude": "10.87531216443598", "timestamp": "1401728167.886038", "trigger": "enter"}' http://localhost:30000/geolocation
 */
exports.backgroundGeolocation = (req, res) => {
  console.log(JSON.stringify(req.body));
  res.send({
    message: 'I was just logging...',
  });
};
