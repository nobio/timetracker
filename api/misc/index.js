const mongoose = require('mongoose');
const moment = require('moment');

const TimeEntry = mongoose.model('TimeEntry');
const GeoTracking = mongoose.model('GeoTracking');
const packageJson = require('../../package.json');

/**
 * exposes a ping endpoint and respones with pong
 *
 * curl -X GET http://localhost:30000/api/ping
 */
exports.ping = (req, res) => {
  const ip = (req.headers['x-forwarded-for'] ||
  req.connection.remoteAddress ||
  req.socket.remoteAddress ||
  req.connection.socket.remoteAddress).split(',')[0];

  res.status(200).send({
    response: 'pong',
    client_ip: ip,
  });
};

/**
 * returns version information
 *
 * curl -X GET http://localhost:30000/api/version
 */
exports.version = (req, res) => {
  if (packageJson) {
    res.status(200).send({
      version: packageJson.version,
      last_build: packageJson.last_build,
    });
  } else {
    res.status(500).send('no package.json found');
  }
};

/**
 * Stores Geo Locations (i.e. latitude and longitude) coming from a mobile device 
 * to geo track
 *
 * curl -X POST -H "Content-Type: application/json" -d '{"latitude": "49.51429653451733", "longitude": "10.87531216443598", "timestamp": "1401728167.886038"}' http://localhost:30000/api/geotrack
 */  
exports.geoTracking = (req, res) => {
   new GeoTracking({
      longitude: req.body.longitude,
      latitude: req.body.latitude
   })
      .save()
      .then(geoTrack => res.status(200).json(geoTrack))
      .catch(err => res.status(500).json(err.message))
};

/*
 * test and experiment endpoint
 *
 * curl -X GET http://localhost:30000/experiment
 */
exports.experiment = (req, res) => {
  let entriesFromDate = [];
  const firstDates = [];
  let actualDate;

  TimeEntry.find().sort({ entry_date: 1 })
    .catch(err => res.send(err))
    .then((timeentries) => {
      timeentries.forEach((timeEntry) => {
        const myDate = moment(timeEntry.entry_date).format('YYYY-MM-DD');
        if (!actualDate) {
          actualDate = myDate;
        }
        if (actualDate === myDate && timeEntry.direction === 'enter') {
          entriesFromDate.push(timeEntry);
        } else {
          firstDates.push(entriesFromDate.reduce((mapped, value) => {
            const m = moment(mapped.entry_date).format('HH:mm');
            const v = moment(value.entry_date).format('HH:mm');
            // console.log(m + ' ' + v + ' -> ' + (m>v));
            if (m < v) {
              return mapped;
            }
            return value;
          }));
          entriesFromDate = [];
          actualDate = undefined;
        }
        console.log(firstDates.length);
      });
      console.log(firstDates);
      res.send('Minimum:\n');
    });
};
