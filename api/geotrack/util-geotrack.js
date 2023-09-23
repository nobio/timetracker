/* eslint-disable no-restricted-syntax */
/* eslint-disable no-mixed-operators */
/* eslint-disable no-console */
const moment = require('moment');
const mongoose = require('mongoose');
const ws = require('../ws');
const utilEntry = require('../entries/util-entries');
const globalUtil = require('../global_util');

const GeoTracking = mongoose.model('GeoTracking');
const GeoFence = mongoose.model('GeoFence');

/**
 * calculate the distance in m between two geo coordinates
 * @param {*} lon1 longitude of geo loc 1
 * @param {*} lat1 latitude of geo loc 1
 * @param {*} lon2 longitude of geo loc 2
 * @param {*} lat2 latitude of geo loc 2
 */
const calcDist = (lon1, lat1, lon2, lat2) => {
  if ((lat1 === lat2) && (lon1 === lon2)) return 0;

  const R = 6371e3; // metres
  const φ1 = lat1 * Math.PI / 180; // φ, λ in radians
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2)
    + Math.cos(φ1) * Math.cos(φ2)
    * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const d = R * c; // in metres
  return Math.round(d, 0);
};

/**
 * calculates the total distance of the singele geo locations of the given time span
 *
 * @param {*} tracks List of geo location points
 */
exports.distance = (tracks) => tracks.reduce((total, t, idx, ts) => {
  if (idx === 0) return 0;
  return total + calcDist(ts[idx - 1].longitude, ts[idx - 1].latitude, t.longitude, t.latitude);
}, 0);

/**
 * calculates the average of measuerd accuracy of the singele geo locations of the given time span
 *
 * @param {*} tracks List of geo location points
 */
exports.meanAccuracy = (tracks) => {
  const meanAcc = (tracks.length === 0 ? 0 : tracks.reduce((total, t) => {
    if (t.accuracy) return total + t.accuracy;
    return total;
  }, 0) / tracks.length);

  const variance = tracks.reduce((total, t) => {
    if (t.accuracy) return total + ((t.accuracy - meanAcc) * (t.accuracy - meanAcc) / tracks.length);
    return total;
  }, 0);

  return {
    mean: meanAcc,
    stdt: Math.sqrt(variance),
  };
};

/**
 * Creats a new data entry for one geo location event
 * @param {*} geoTrack GeoTracking object
 * @param {*} res Response object
 */
exports.createGeoTrack = async (geoTrack) => {
  if (!geoTrack) return;

  try { await this.geoFence(geoTrack); } catch (error) { console.error(error.message); }
  try {
    globalUtil.sendMessage('GEOFENCE_DEBUG', `LON: ${geoTrack.longitude}, LAT: ${geoTrack.latitude}, ACCURACY: ${geoTrack.accuracy}`);
  } catch (error) {
    console.error('ignoring error during debugging');
  }

  try {
    ws.sendGeoLocation(geoTrack);
    return await geoTrack.save();
  } catch (error) {
    if (error.code === 11000) {
      console.error('ignoring duplication error');
      const err = new Error('ignoring duplication error'); err.status = 202;
      throw err;
    } else {
      const err = new Error(error.message); err.status = 500;
      throw err;
    }
  }
};

exports.parseGeoTrackingObject = (body) => {
  let geoTrack;
  if (body === null || !body) {
    // encrypted...
    return null;
  }
  // find out if this is hassio or OwnTracks data
  if (body.lon && body.lat) {
    // OWN_TRACKS
    /**
     * https://owntracks.org/booklet/tech/json/
    {
      cog: 120,                              Course over ground (iOS/integer/degree/optional)
      batt: 48,                              Device battery level (iOS,Android/integer/percent/optional)
      lon: 10.875663,                        longitude (iOS,Android/float/degree/required)
      acc: 32,                               Accuracy of the reported location in meters without unit (iOS,Android/integer/meters/optional)
      bs: 2,                                 Battery Status 0=unknown, 1=unplugged, 2=charging, 3=full (iOS, Android)
      p: 97.779,                             barometric pressure (iOS/float/kPa/optional/extended data)
      created_at: 1632585236,
      BSSID: 'c8:e:14:7b:5f:8d',
      SSID: 'WLAN Kabel',
      vel: 0,                                velocity (iOS,Android/integer/kmh/optional)
      vac: 3,                                vertical accuracy of the alt element (iOS/integer/meters/optional)
      lat: 49.514447,                        atitude (iOS,Android/float/degree/required)
      topic: 'owntracks/owntracks-user/026D4FAA-69D0-4673-B216-1C464919F9A8',
      t: 't',                                t: timer based publish in move move (iOS)
      conn: 'w',                             w: WiFi, o offline, m mobile data
      tst: 1632584826,                       UNIX epoch timestamp in seconds of the location fix (iOS,Android/integer/epoch/required)
      alt: 309,                              Altitude measured above sea level (iOS,Android/integer/meters/optional)
      _type: 'location',
      tid: 'A8'                              Tracker ID used to display the initials of a user (iOS,Android/string/optional) required for http mode
    }
       */
    geoTrack = new GeoTracking({
      longitude: body.lon,
      latitude: body.lat,
      accuracy: body.acc,
      altitude: body.alt,
      velocity: body.vel,
      // battery: body.batt,
      date: moment.unix(body.tst),
      // eslint-disable-next-line no-nested-ternary
      source: (body.desc) ? body.desc : (body.tid) ? body.tid : 'unknown',
    });
  } else if (body.longitude && body.latitude) {
    // HASSIO
    geoTrack = new GeoTracking({
      longitude: body.longitude,
      latitude: body.latitude,
      accuracy: body.accuracy,
      source: body.source,
    });
    // eslint-disable-next-line no-underscore-dangle
  } else if (body._type === 'encrypted') {
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
      .then(transform)
      .then(appendMetadata)
      .then((tracks) => resolve(tracks))
      .catch((err) => reject(err));
  });
};

/**
 * finds some meta data about the geo coordinates like distance and deviation of
 * distances (depend on accuracy)
 * @param {*} tracks tracking data
 */
exports.getGeoTrackingMetadata = async (tracks) => ({
  size: tracks.length,
  totalDistance: this.distance(tracks),
  accuracy: this.meanAccuracy(tracks),
});

const transform = (tracks) => {
  const tr = [];
  tracks.forEach((t) => {
    tr.push({
      date: t.date,
      longitude: t.longitude,
      latitude: t.latitude,
      velocity: (t.velocity || 0),
      dist: 0,
      altitude: (t.altitude || 0),
      timediff: 0,
      accuracy: (t.accuracy || 0),
      sourc: (t.source || 'X'),
    });
  });
  return tr;
};

const appendMetadata = (tracks) => {
  let oldPoint;
  tracks.forEach((point) => {
    if (oldPoint) {
      const dist = calcDist(oldPoint.longitude, oldPoint.latitude, point.longitude, point.latitude); // distance in meter
      const timeDiff = moment(point.date).diff(moment(oldPoint.date)) / 1000; // time difference in seconds
      const velocity = (point.velocity || dist / timeDiff); // velocity in m/s
      point.dist = dist;
      point.timediff = timeDiff;
      point.velocity = velocity;
    }
    oldPoint = point;
  });
  // console.log(JSON.stringify(tracks, null, 2))

  return tracks;
};

/**
 * Calculates the distance from this point to all the configured geo fences
 * If ths distance is smaller then check the status and eventually create
 * a geo fence
 * @param {} geoTrack
 curl -X POST  -H "Content-Type: application/json"  -d '{"lat": "49.51429653451733", "lon": "10.87531216443598", "acc": 10, "alt": 320, "tid": "A8", "tst": 1694722307}' http://localhost:30000/api/geotrack
 */
exports.geoFence = async (geoTrack) => {
  const geoFences = await GeoFence.find();
  // console.log(JSON.stringify(geoFences));
  // eslint-disable-next-line no-restricted-syntax
  let bSaved = false;
  for (const gf of geoFences) {
    if (gf.enabled) { // only do something when this geofence is enabled
      let direction;
      const dist = calcDist(geoTrack.longitude, geoTrack.latitude, gf.longitude, gf.latitude);
      console.log(`${gf.description}: distance=${dist}m and radius=${gf.radius}m; I am checked in: ${gf.isCheckedIn}`);

      if (dist <= gf.radius && !gf.isCheckedIn) {
        console.log('Treffer - einchecken!!!');
        direction = 'enter';
      } else if (dist > gf.radius && gf.isCheckedIn) {
        console.log('Treffer - auschecken!!!!');
        direction = 'go';
      } else {
        console.log('kein Handlungsbedarf da Entfernung größer als Radius ist');
      }

      // if no direction was found then do not create a new time entry
      if (direction && !bSaved) {
        const timeEntry = {
          direction,
          longitude: geoTrack.longitude,
          latitude: geoTrack.latitude,
          datetime: geoTrack.date,
        };
        try {
          utilEntry.create(timeEntry);
          bSaved = true;
        } catch (error) {
          console.error(`trying to create a new time entry but not successful: ${error.message}`);
        }
      }
      try {
        gf.isCheckedIn = (direction === 'enter');
        gf.lastChange = geoTrack.date;
        gf.save();
      } catch (error) {
        console.error(`trying to save this geofence (${gf.description}): ${error.message}`);
      }
    }
  }
};
