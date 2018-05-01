const mongoose = require('mongoose');
const moment = require('moment');
const tz = require('moment-timezone');
const util = require('./util');

const TimeEntry = mongoose.model('TimeEntry');

/* ================================================================== */
/* =========================== JADE/HTML ============================ */
/* ================================================================== */

/*
 * calculates the number of entries and renders the index.jade by passing the size
 */
exports.index = (req, res) => {
  util.getNumberOfTimeEntries((err, size) => {
    console.log(size);
    res.render('index', {
      size,
    });
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
 * creates a new TimeEntry; the date is "now" and the direction needs to be given
 */
exports.createEntry = (req, res) => {
  console.log(JSON.stringify(req.body));
  const direction = req.body.direction;
  const datetime = req.body.datetime;
  const longitude = req.body.longitude;
  const latitude = req.body.latitude;

  util.createTimeEntry(direction, datetime, longitude, latitude, (err, timeentry) => {
    if (err) {
      res.send(500, `Error while creating new  Time Entry: ${err.message}`);
    } else {
      res.send(timeentry);
    }
  });
};
/*
 * deletes one time entry by it's id
 */
exports.delete = (req, res) => {
  const id = req.params.id;

  TimeEntry.findByIdAndRemove(id, (err) => {
    if (err) {
      res.send(500, `Error while deleting Time Entry: ${id} ${err.message}`);
    } else {
      res.send(id);
    }
  });
};

/*
 * Reads all time entries
 * Read entries by date: getAllByDate
 * Read busy time: getBusyTime
 *
 * curl -X GET http://localhost:30000/entries
 * curl -X GET http://localhost:30000/entries?dt=1393455600000
 * curl -X GET http://localhost:30000/entries?busy=1393455600000
 */
exports.getEntries = (req, res) => {
  const filterByDate = req.query.dt;
  const filterByBusy = req.query.busy;

  if (filterByDate && filterByBusy) {
    console.log('filter by date and busy');
    res.send(500, 'date and busy filter set; can only handle one of them');
  } else if (filterByDate) {
    console.log(`filter by date: ${filterByDate}`);
    getAllByDate(filterByDate, res);
  } else if (filterByBusy) {
    console.log(`filter by busy: ${filterByBusy}`);
    getBusyTime(filterByBusy, res);
  } else {
    TimeEntry.find((err, timeentries) => {
      if (err) {
        res.send(500, `Error while reading Time Entries: ${id} ${err}`);
      } else {
        res.send(timeentries);
      }
    });
  }
};
/*
 * lists all Time Entries for a given date (this particular day)
 *
 * curl -X GET http://localhost:30000/entries/dt/1451084400000
 */
function getAllByDate(date, res) {
  const dt = util.stripdownToDateBerlin(moment.unix(date / 1000));
  console.log(`getAllByDate received date:               ${moment(dt).format('DD.MM.YYYY HH:mm:ss')}`);

  util.getTimeEntriesByDate(dt, (err, timeentries) => {
    if (err) {
      res.send(500, err);
    } else {
      res.send(timeentries);
    }
  });
}
/*
 * get one Time Entry by it's id
 */
exports.getEntryById = (req, res) => {
  TimeEntry.findById(req.params.id, (err, timeentry) => {
    if (err) {
      res.send(500, `Error while reading Time Entry: ${req.params.id} ${err}`);
    } else {
      res.send(timeentry);
    }
  });
};
/*
 * stores one Time Entry
 */
exports.storeEntryById = (req, res) => {
  console.log(`${req.params.id}, ${req.body.direction}, ${req.body.entry_date}`);

  TimeEntry.findById(req.params.id, (err, timeentry) => {
    console.log(err);
    if (err) {
      res.send(500, `Error while reading Time Entry: ${err}`);
    } else {
      timeentry.direction = req.body.direction;
      timeentry.entry_date = moment(req.body.entry_date);
      timeentry.last_changed = new Date();

      console.log(timeentry);

      timeentry.save((err) => {
        if (err) {
          res.send(500, `Error while saving Time Entry: ${err}`);
        } else {
          res.send(timeentry);
        }
      });
    }
  });
};

/*
 * Reads the busy time of all entries for a given day
 *
 * curl -X GET http://localhost:30000/entries?busy=1393455600000
 */
function getBusyTime(date, res) {
  const dt = util.stripdownToDateBerlin(moment.unix(date / 1000));

  util.getBusytimeByDate(dt, (err, d, busytime) => {
    if (err) {
      res.status(500).send(err.toString());
      // res.send(500, err.toString());
    } else {
      const duration = `${moment.duration(busytime)._milliseconds}`;
      res.send({ duration });
    }
  });
}

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
  if (req.body.id == 'Work') {
    util.createTimeEntry(direction, moment(), req.body.longitude, req.body.latitude, (err, timeentry) => {
      if (err) {
        res.send(500, `Error while creating new  Time Entry: ${err.message}`);
      } else {
        res.send(timeentry);
      }
    });
  } else {
    res.send({
      message: 'nothing to be entered',
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
