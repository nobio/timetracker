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
      altitude: req.body.alt,
      date: moment.unix(req.body.tst),
      source: (req.body.desc) ? req.body.desc : (req.body.tid) ? req.body.tid : 'unknown',
    });
  } else if (req.body.longitude && req.body.latitude) {
    // HASSIO
    geoTrack = new GeoTracking({
      longitude: req.body.longitude,
      latitude: req.body.latitude,
      accuracy: req.body.accuracy,
      source: req.body.source,
    });
  } else if (req.body._type === 'encrypted') {
    // encrypted...
    geoTrack = null;
  }
  return geoTrack;
}

function getGeoTrackingDataByTime(dtStart, dtEnd) {
  const options = {
    $gte: dtStart,
    $lte: dtEnd,
  };

  console.log(options);

  return new Promise((resolve, reject) => {
    GeoTracking.find({
      date: options,
    }).skip(0).sort({ date: 1 })
      .then(tracks => resolve(tracks))
      .catch(err => reject(err));
  });
}


/**
 * Stores Geo Locations (i.e. latitude and longitude) coming from a mobile device
 * to geo track
 *
 * curl -X POST -H "Content-Type: application/json" -d '{"latitude": "49.51429653451733", "longitude": "10.87531216443598", "accuracy": 10, "source": "cli"}' http://localhost:30000/api/geotrack
 * curl -X POST -H "Content-Type: application/json" -d '{"lat": "49.51429653451733", "lon": "10.87531216443598", "acc": 10, "alt": 320, "tid": "A8", "tst": 1594722307}' http://localhost:30000/api/geotrack
 * curl -X POST -H "Content-Type: application/json" -d '{"batt":47,"lon":11.130830364065023,"acc":65,"p":97.75843048095703,"bs":1,"vac":5,"lat":49.42936418399344,"topic":"owntracks/user/026D4FAA-69D0-4673-B216-1C464919F9A8","t":"t","conn":"w","tst":1594723732,"alt":340,"_type":"location","tid":"A8"}' http://localhost:30000/api/geotrack
 * curl -X POST -H "Content-Type: application/json" -d '{"rad":60,"tst":1594722217,"_type":"waypoint","lon":11.13133862839,"topic":"owntracks/user/026D4FAA-69D0-4673-B216-1C464919F9A8/waypoint","lat":49.428161621094,"desc":"zu Hause"}' http://localhost:30000/api/geotrack
 * curl -X POST -H "Content-Type: application/json" -d '{"_type":"encrypted","data":"O5O4V7PF0o90tfmGg04TnGDJ73sA9iIxHpEvQ3J3qwHs3Vqh77lH1/Kh5PxMnZLDZzLn7AWtz+87GZ5+q04PzmqVJcoCud1qg5tEVAQOrlxRS8XZKhc3tLUJm6B2t5Cjb3Ro51+y1MX2lLe+1KMhhpWjZkSvQNf4trFfoOpN5w38rlrBB4VCFJeLFKJzICEFkE0kTwYyJpeHUKJ/wmed20fPT3RXWd6ozYhxa7NrUl+aa15gB7f0BemdhoVJ6EZJHeo9zsRevqEfF0wOiQnul4PujceCL41JFE2iuAtDRyN0yns="}' http://localhost:30000/api/geotrack
 */
exports.createGeoTrack = (req, res) => {
  console.log(JSON.stringify(req.body));

  const geoTrack = parseGeoTrackingObject(req);
  console.log(geoTrack);
  if (geoTrack === null) {
    console.error('data encrypted')
    res.status(202).send('data encrypted');
    return;
  } else if (!geoTrack) {
    console.error('missing data (longitude, latitude, accuracy, source)')
    res.status(400).send('missing data (longitude, latitude, accuracy, source)');
    return;
  }

  geoTrack
    .save()
    .then(gt => res.status(200).json(gt))
    .catch(err => {
      if (err.code === 11000) {
        console.error('ignoring duplication error')
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
 * curl -X GET "http://localhost:30000/api/geotrack?dateStart=2020-03-09&dateEnd=2020-03-10" -H "accept: application/json"
 */
exports.getGeoTracking = (req, res) => {
  let dtStart = moment(req.query.dateStart);
  let dtEnd = moment(req.query.dateEnd);

  if (!req.query.dateStart) dtStart = moment('1970-01-01');
  if (!req.query.dateEnd) dtEnd = moment();


  getGeoTrackingDataByTime(dtStart, dtEnd)
    .then(tracks => res.status(200).send(tracks))
    .catch(err => res.status(err.status).json({ message: err.message }));
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

  getGeoTrackingDataByTime(dtStart, dtEnd)
    .then(tracks => res.status(200).send(tracks))
    .catch(err => {
      if (!err.status) {
        err.status = 500;
      }
      res.status(err.status).json({ message: err.message });
    });
};
