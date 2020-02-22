const mongoose = require('mongoose');
const moment = require('moment');

const GeoTracking = mongoose.model('GeoTracking');
const util = require('../entries/util-entries');

/**
 * Stores Geo Locations (i.e. latitude and longitude) coming from a mobile device
 * to geo track
 *
 * curl -X POST -H "Content-Type: application/json" -d '{"latitude": "49.51429653451733", "longitude": "10.87531216443598", "accuracy": 10, "source": "cli"}' http://localhost:30000/api/geotrack
 */
exports.createGeoTrack = (req, res) => {
  console.log(JSON.stringify(req.body));
  if (req.body.longitude == null || req.body.latitude == null || req.body.accuracy == null || req.body.source == null) {
    res.status(400).send('missing data (longitude, latitude, accuracy, source)');
    return;
  }
  new GeoTracking({
    longitude: req.body.longitude,
    latitude: req.body.latitude,
    accuracy: req.body.accuracy,
    source: req.body.source,
  })
    .save()
    .then(geoTrack => res.status(200).json(geoTrack))
    .catch(err => res.status(500).json(err.message));
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
    }).skip(0).sort({ entry_date: 1 });

    res.status(200).send(tracks);
  } catch (err) {
    if (!err.status) {
      err.status = 500;
    }
    res.status(err.status).json({ message: err.message });
  }
};
