/* eslint-disable no-mixed-operators */
/* eslint-disable no-console */
const mongoose = require('mongoose');
const moment = require('moment');

const GeoTracking = mongoose.model('GeoTracking');

/**
 * calculate the distance in m between two geo coordinates
 * @param {*} lon1 longitude of geo loc 1
 * @param {*} lat1 latitude of geo loc 1
 * @param {*} lon2 longitude of geo loc 2
 * @param {*} lat2 latitude of geo loc 2
 */
function calcDist(lon1, lat1, lon2, lat2) {
  if ((lat1 === lat2) && (lon1 === lon2)) return 0;

  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const d = R * c; // in metres
  return Math.round(d, 0);
}

/**
 * calculates the total distance of the singele geo locations of the given time span
 *
 * @param {*} tracks List of geo location points
 */
function distance(tracks) {
  return tracks.reduce((total, t, idx, ts) => {
    if (idx === 0) return 0;
    return total + calcDist(ts[idx - 1].longitude, ts[idx - 1].latitude, t.longitude, t.latitude);
  }, 0);
}

/**
 * calculates the average of measuerd accuracy of the singele geo locations of the given time span
 *
 * @param {*} tracks List of geo location points
 */
function meanAccuracy(tracks) {
  const meanAcc = tracks.reduce((total, t) => {
    if (t.accuracy) return total + t.accuracy;
    return total;
  }, 0) / tracks.length;

  const variance = tracks.reduce((total, t) => {
    if (t.accuracy) return total + ((t.accuracy - meanAcc) * (t.accuracy - meanAcc) / tracks.length);
    return total;
  }, 0);
  return {
    mean: meanAcc,
    stdt: Math.sqrt(variance),
  };
}

/**
 * Creats a new data entry for one geo location event
 * @param {*} req Request object
 * @param {*} res Response object
 */
exports.createGeoTrack = (req, res) => {
  const geoTrack = this.parseGeoTrackingObject(req);

  if (geoTrack === null) {
    console.error('data encrypted');
    res.status(202).send('data encrypted');
    return;
  } else if (!geoTrack) {
    console.error('missing data (longitude, latitude, accuracy, source)');
    res.status(400).send('missing data (longitude, latitude, accuracy, source)');
    return;
  }

  geoTrack.save()
    .then(gt => res.status(200).json(gt))
    .catch((err) => {
      if (err.code === 11000) {
        console.error('ignoring duplication error');
        res.status(202).json(err.message);
      } else {
        console.log(err.code);
        res.status(500).json(err.message);
      }
    });
};


exports.parseGeoTrackingObject = (req) => {
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
      // eslint-disable-next-line no-nested-ternary
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
    // eslint-disable-next-line no-underscore-dangle
  } else if (req.body._type === 'encrypted') {
    // encrypted...
    geoTrack = null;
  }
  return geoTrack;
};

exports.getGeoTrackingDataByTime = (dtStart, dtEnd) => {
  let start = dtStart;
  let end = dtEnd;
  if (!dtStart) start = moment('1970-01-01');
  if (!dtEnd) end = moment();

  const options = {
    $gte: start,
    $lte: end,
  };

  return new Promise((resolve, reject) => {
    GeoTracking.find({
      date: options,
    }).skip(0).sort({ date: 1 })
      .then(tracks => resolve(tracks))
      .catch(err => reject(err));
  });
};

/**
 * finds some meta data about the geo coordinates like distance and deviation of
 * distances (depend on accuracy)
 * @param {*} tracks tracking data
 */
exports.getGeoTrackingMetadata = tracks => new Promise((resolve) => {
  resolve({
    size: tracks.length,
    totalDistance: distance(tracks),
    accuracy: meanAccuracy(tracks),
  });
});

