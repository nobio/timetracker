/* eslint-disable no-console */
const moment = require('moment');
const util = require('./util-geotrack');
const { Tracer } = require('../tracing/Tracer');

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
exports.createGeoTrack = async (req, res) => {
  const span = Tracer.startSpan('geotrack.createGeoTrack');
  const geoTrack = util.parseGeoTrackingObject(req.body);

  if (geoTrack === null) {
    console.error('data encrypted');
    res.status(202).send('data encrypted');
    return;
  } if (!geoTrack) {
    console.error('missing data (longitude, latitude, accuracy, source)');
    res.status(400).send('missing data (longitude, latitude, accuracy, source)');
    return;
  }

  await util.createGeoTrack(geoTrack)
    .then((tracks) => res.status(200).send(tracks))
    .catch((err) => { span.recordException(err); res.status(err.status).json({ message: err.message }); })
    .finally(() => span.end());
};

/**
 * reads geo tracks
 *
 * curl -X GET http://localhost:30000/api/geotrack
 * curl -X GET "http://localhost:30000/api/geotrack?dateStart=2020-03-09&dateEnd=2020-03-10" -H "accept: application/json"
 */
exports.getGeoTracking = (req, res) => {
  const span = Tracer.startSpan('geotrack.getGeoTracking');
  const dtStart = moment(req.query.dateStart);
  const dtEnd = moment(req.query.dateEnd);

  util.getGeoTrackingDataByTime(dtStart, dtEnd)
    .then((tracks) => res.status(200).send(tracks))
    .catch((err) => { span.recordException(err); res.status(err.status).json({ message: err.message }); })
    .finally(() => span.end());
};

/**
 * curl -X GET "http://localhost:30000/api/geotrack/metadata?dateStart=2020-03-09&dateEnd=2020-03-10"
 * @param {*} req request object
 * @param {*} res response object
 */
exports.getGeoTrackingMetadata = (req, res) => {
  const span = Tracer.startSpan('geotrack.getGeoTrackingMetadata');
  const dtStart = moment(req.query.dateStart);
  const dtEnd = moment(req.query.dateEnd);

  util.getGeoTrackingDataByTime(dtStart, dtEnd)
    .then(util.getGeoTrackingMetadata)
    .then((metaData) => res.status(200).send(metaData))
    .catch((err) => { span.recordException(err); res.status(err.status ? err.status : 500).json({ message: err.message }); })
    .finally(() => span.end());
};
