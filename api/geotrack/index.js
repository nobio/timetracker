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
exports.geoTracking = (req, res) => {
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

    if(!err.status) {
      err.status = 500;
    }
    res.status(err.status).json({ message: err.message });
  }
};


/**
 * reads geo tracking data for a given date
 * curl -X GET http://localhost:30000/api/geotrack/1580886983000
 */
exports.getGeoTrackingForDate = async (req, res) => {

  const dt = req.params.date;
  // ====== TODO: refactor util-entries.stripdownToDateBerlin to a common module and use it here
  const dtStart = util.stripdownToDateBerlin(moment.unix(dt / 1000));
  const dtEnd = moment(dtStart).add(1, 'days');
  
  //console.log(dtStart);
  //console.log(dtEnd);

  try {
    const tracks = await GeoTracking.find({
      date: {
        $gte: dtStart,
        $lt: dtEnd,
      },
    }).skip(0).sort({ entry_date: 1 });

    res.status(200).send(tracks);
    
  } catch (err) {
   if(!err.status) {
      err.status = 500;
    }
    res.status(err.status).json({ message: err.message });
  }
};
