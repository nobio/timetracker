/* eslint-disable no-console */
const mongoose = require('mongoose');
const moment = require('moment');

const GeoTracking = mongoose.model('GeoTracking');
const util = require('../entries/util-entries');

function parseGeoTrackingObject(req) {
  let geoTrack;

  // find out if this is hassio or OwnTracks data
  if (req.body.lon && req.body.lat) {
    // OWN_TRACKS
    geoTrack = new GeoTracking({
      longitude: req.body.lon,
      latitude: req.body.lat,
      accuracy: req.body.acc,
      source: req.body.tid,
      altitude: req.body.alt,
      date: moment.unix(req.body.tst),
    });
  } else if (req.body.longitude && req.body.latitude) {
    // HASSIO
    geoTrack = new GeoTracking({
      longitude: req.body.longitude,
      latitude: req.body.latitude,
      accuracy: req.body.accuracy,
      source: req.body.source,
    });
  }
  return geoTrack;
}

/**
 * Stores Geo Locations (i.e. latitude and longitude) coming from a mobile device
 * to geo track
 *
 * curl -X POST -H "Content-Type: application/json" -d '{"latitude": "49.51429653451733", "longitude": "10.87531216443598", "accuracy": 10, "source": "cli"}' http://localhost:30000/api/geotrack
 * curl -X POST -H "Content-Type: application/json" -d '{"lat": "49.51429653451733", "lon": "10.87531216443598", "acc": 10, "alt": 320, "tid": "A8", "tst": 1594722307}' http://localhost:30000/api/geotrack
 * curl -X POST -H "Content-Type: application/json" -d '{"batt":47,"lon":11.130830364065023,"acc":65,"p":97.75843048095703,"bs":1,"vac":5,"lat":49.42936418399344,"topic":"owntracks/user/026D4FAA-69D0-4673-B216-1C464919F9A8","t":"t","conn":"w","tst":1594723732,"alt":340,"_type":"location","tid":"A8"}' http://localhost:30000/api/geotrack
 */
exports.createGeoTrack = (req, res) => {
  console.log(JSON.stringify(req.body));

  const geoTrack = parseGeoTrackingObject(req);
  console.log(geoTrack);
  if (!geoTrack) {
    res.status(400).send('missing data (longitude, latitude, accuracy, source)');
    return;
  }

  geoTrack
    .save()
    .then(gt => res.status(200).json(gt))
    .catch(err => {
      if (err.code === 11000) {
        res.status(202).json(err.message);
      } else {
        console.log(err.code); 
        res.status(500).json(err.message);
      }
    });
};

/**
 * reads geo tracks
 *
 * curl -X GET http://localhost:30000/api/geotrack
 */
exports.getGeoTracking = async (req, res) => {
  try {
    const tracks = await GeoTracking.find().sort({ date: 1 });
    res.status(200).send(tracks);
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    res.status(err.status).json({ message: err.message });
  }
};


/**
 * reads geo tracking data for a given date
 * curl -X GET http://localhost:30000/api/geotrack/1580886983
 * curl -X GET http://localhost:30000/api/geotrack/2020-02-21
 *
 * generate timestamp on unix cli: date +%s
 */
exports.getGeoTrackingForDate = async (req, res) => {
  const regexDate = new RegExp('^[0-9]{4}-(0[1-9]|1[012])-(0[1-9]|[12][0-9]|3[01])$');
  const regexTimestemp = new RegExp('^1[0-9]{9}$');
  const dt = req.params.date;
  let dtStart;

  // check the parameter: if it matches yyyy-mm-dd then get moment from this format
  if (regexDate.test(dt)) {
    dtStart = moment(dt);
  } else if (regexTimestemp.test(dt)) {
    dtStart = util.stripdownToDateBerlin(moment.unix(dt));
  } else {
    res.status(400).send('format of date invalid; provide timestamp or date (yyyy-mm-dd)');
    return;
  }
  const dtEnd = moment(dtStart).add(1, 'days');

  // console.log(dtStart);
  // console.log(dtEnd);

  try {
    const tracks = await GeoTracking.find({
      date: {
        $gte: dtStart,
        $lt: dtEnd,
      },
    }).skip(0).sort({ date: 1 });

    res.status(200).send(tracks);
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    res.status(err.status).json({ message: err.message });
  }
};

