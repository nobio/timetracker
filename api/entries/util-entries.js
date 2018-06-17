/**
 *
 * Methods of this file must never be used from server.js directly rather than from api layer
 *
 */
require('../../db');

const moment = require('moment');
const mongoose = require('mongoose');

const TimeEntry = mongoose.model('TimeEntry');

const DEFAULT_BREAK_TIME = 45 * 60 * 1000; // 45 min in milli seconds

/**
 * function to check wheather an object is empty or not
 */
exports.isEmpty = obj => isEmpty(obj);
function isEmpty(obj) {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      return false;
    }
  }
  return true;
}

/**
 * takes the date and removes all time components
 * date expected to be a moment object
 */
exports.stripdownToDateBerlin = (date) => {
  const d = moment.tz(date / 1, 'Europe/Berlin');
  d.millisecond(0);
  d.second(0);
  d.minutes(0);
  d.hours(0);
  // console.log(d.format('YYYY-MM-DD HH:mm:ss'))
  return d;
};

/**
 * finds one entry by it's id
 * @param id unique id of an entry like 5a2100cf87f1f368d087696a
 * @returns TimeEntry object like
 *
 {
   "direction" : "enter",
   "latitude" : 49.448335,
   "entry_date" : "2017-12-01T07:12:15.567Z",
   "_id" : "5a2100cf87f1f368d087696a",
   "longitude" : 11.091801,
   "__v" : 0,
   "last_changed" : "2017-12-01T07:12:15.623Z"
}
 */
exports.findById = id => {
  // console.log('entered findById ' + id)
  return new Promise((resolve, reject) => {
    TimeEntry.findById(id)
      .then(timeentries => resolve(timeentries))
      .catch(err => reject(err));
  });
}


/**
 * Creates a new TimeEntry itemt in database
 * - validate
 *   -> first read getLastTimeEntryByDate
 *     -> if no entry of that day available the new time entry bust be "enter"
 *     -> last entry must be older then x seconds (avoid double entries)
 *     -> check last entry: must be opposite of the new one
 * - create
 *
 * @param direction enter/go
 * @param datetime (optional; default = now) the date (example: new Date() or moment(...)) of this TimeEntry
 * @param longitude (optional) the longitude of this TimeEntry
 * @param latitude (optional) the latitude of this TimeEntry
 * @returns new TimeEntry object
 */
exports.create = (timeEntry) => {
  if (!timeEntry) {
    throw new Error('to update a record, the passed object must not be undefined');
  }

  if (!timeEntry.datetime) {
    timeEntry.datetime = moment();
  }

  return new Promise((resolve, reject) => {
    this.getLastTimeEntryByDate(timeEntry.datetime)
      .then((lastTimeEntry) => {
        console.log(JSON.stringify(timeEntry));
        if (!lastTimeEntry) { // no entry today -> direction must be 'enter'
          if (timeEntry.direction != 'enter') {
            reject(new Error(`first entry of the day must be an enter and not ${timeEntry.direction}`));
            return;
          }
        } else {
          if (lastTimeEntry.direction === timeEntry.direction) { // entry already exists -> direction must be opposite
            reject(new Error(`this entry has direction ${timeEntry.direction} but last entry has also direction ${lastTimeEntry.direction}`));
            return;
          }
          /*
          const now = moment();
          const entryDate = moment(lastTimeEntry.entry_date);
          const timelapse = now - entryDate;

          //console.log(timelapse + ' ms or ' + timelapse / 1000/60/60 + ' sec')
          if (timelapse < 1000 * 1) { // not longer than 1 sec
            reject(new Error(`it seems to be a double entry since the last item and this one are created within ${timelapse} ms`));
            return;
          }
          */
        }

        // all checks successfully done, lets create the TimeEntry!
        new TimeEntry({
          entry_date: timeEntry.datetime,
          direction: timeEntry.direction,
          longitude: timeEntry.longitude,
          latitude: timeEntry.latitude,
        }).save()
          .then(tEntry => resolve(tEntry))
          .catch(err => reject(err));
      })
      .catch(err => reject(err));
  });
};

/**
 * Stores an existing TimeEntry item in database
 *
 * @param id unique identifier of the Time Entry (to load)
 * @param direction enter/go
 * @param datetime (optional; default = now) the date (example: new Date() or moment(...)) of this TimeEntry
 * @param longitude (optional) the longitude of this TimeEntry
 * @param latitude (optional) the latitude of this TimeEntry
 *
 * @returns new TimeEntry object
 */
// exports.update = (timeEntry, id, direction, datetime, longitude, latitude) => {
exports.update = (timeEntry) => {
  if (!timeEntry) {
    throw new Error('to update a record, the passed object must not be undefined');
  }

  return new Promise((resolve, reject) => {
    TimeEntry.findById(timeEntry.id)
      .then((te) => {
        if (te === null) {
          resolve(null);
          return;
        }
        te.direction = (timeEntry.direction === undefined) ? te.direction : timeEntry.direction;
        te.longitude = (timeEntry.longitude === undefined) ? te.longitude : timeEntry.longitude;
        te.latitude = (timeEntry.latitude === undefined) ? te.latitude : timeEntry.latitude;
        te.datetime = (timeEntry.datetime === undefined) ? te.datetime : timeEntry.datetime;
        te.entry_date = (timeEntry.entry_date === undefined) ? te.entry_date : timeEntry.entry_date;
        te.last_changed = new Date();
        // console.log(te)
        return te;
      })
      .then(te => te.save())
      .then(te => resolve(te))
      .catch(err => reject(err));
  });
};

/**
 * deletes one entry by it's id
 * @param id unique id of an entry like 5a2100cf87f1f368d087696a
 * @returns TimeEntry object that has been deleted
 */
exports.deleteById = id =>
  // console.log('entered deleteById ' + id)
  new Promise((resolve, reject) => {
    TimeEntry.findByIdAndRemove(id)
      .then(timeentry => resolve(timeentry))
      .catch(err => reject(err));
  });


/**
 * lists all Time Entries for a given date (this particular day)
 *
 * @returns Promise
 */
exports.getAllByDate = (date) => {
  const dtStart = this.stripdownToDateBerlin(moment.unix(date / 1000));
  const dtEnd = moment(dtStart).add(1, 'days');
  // console.log('getAllByDate received date: ' + moment(dtStart).format('DD.MM.YYYY HH:mm:ss') + ' - ' + moment(dtEnd).format('DD.MM.YYYY HH:mm:ss'))

  return new Promise((resolve, reject) => {
    TimeEntry.find({
      entry_date: {
        $gte: dtStart,
        $lt: dtEnd,
      },
    }).skip(0).sort({ entry_date: 1 })
      .then((timeentries) => {
        /*
        if (timeentries.length === 0) {
          // /reject(new Error(`Es gibt keine Einträge für diesen Tag (${date.format('DD.MM.YYYY')})`), 1);
          resolve([]);
        } else if (timeentries.length % 2 !== 0) {
          // reject(new Error(`Bitte die Einträge für diesen Tag (${date.format('DD.MM.YYYY')}) vervollständigen`), 0);
          resolve(timeentries);
        } else {
          resolve(timeentries);
        }
        */
        resolve(timeentries);
      })
      .catch(err => reject(new Error(`Unable to read Time Entry for given date : ${date} (${err.message})`)));
  });
};

/**
 * Reads the busy time and pause time of all entries for a given day
 *
 * @param list of time entry objects (usually 2) from getAllByDate method
 * @returns Promise
 */
exports.calculateBusyTime = timeentries => new Promise((resolve, reject) => {
  // console.log(timeentries);

  if (timeentries.length === 0) {
    // reject(new Error(`Es gibt keine Einträge für diesen Tag (${dt.format('DD.MM.YYYY')})`), 0);
    resolve([]);
  } else if (timeentries.length % 2 !== 0) {
    reject(new Error('Bitte die Einträge für vervollständigen'), 0);
  } else {
    let busytime = 0;
    let pause = 0;

    for (let n = timeentries.length - 1; n > 0; n -= 2) {
      // this must be a go-event
      if (timeentries[n].direction !== 'go') {
        reject(new Error('Die Reihenfolge der Kommen/Gehen-Einträge scheint nicht zu stimmen.'), 0);
        return;
      }

      const end = timeentries[n].entry_date;
      const start = timeentries[n - 1].entry_date;
      busytime += (end - start);

      if (n > 2) {
        pause += (start - timeentries[n - 2].entry_date);
      }
    }

    // when there have been only 2 entries we reduce the busytime by 45 minutes (default pause)
    if (timeentries.length === 2) {
      busytime -= DEFAULT_BREAK_TIME;
      pause = DEFAULT_BREAK_TIME;
    }

    const duration = timeentries[timeentries.length - 1].entry_date - timeentries[0].entry_date;

    resolve({
      duration,
      busytime,
      pause,
      count: timeentries.length,
    });
  }
});

/**
 * Reads all TimeEntry items from database
 */
exports.getAll = () => new Promise((resolve, reject) => {
  TimeEntry.find()
    .then(timeentries => resolve(timeentries))
    .catch(err => reject(err.message));
});

/*
 * reads the number of all TimeEntries in database
 */
exports.count = () => new Promise((resolve, reject) => {
  TimeEntry.find()
    .then(timeentries => resolve(timeentries.length))
    .catch(err => reject(err.message));
});

/**
 * reads the last entry for a given date
 *
 * @param dt (*) Date to which the last entry is to be read; example: "2017-12-19T19:34:00.000Z"
 * @returns Promise and then (resolve) last time entry of the given date (no array, ony one TimeEntry)
 */
exports.getLastTimeEntryByDate = (dt) => {
  if (typeof (dt) === 'string') {
    dt = moment(dt);
  }
  const dtStart = this.stripdownToDateBerlin(dt);
  const dtEnd = moment(dtStart).add(1, 'days');

  // console.log(dtStart.toDate() + '\n' + dtEnd.toDate())

  return new Promise((resolve, reject) => {
    TimeEntry.find({
      entry_date: {
        $gte: dtStart,
        $lt: dtEnd,
      },
    }).skip(0).limit(1).sort({ entry_date: -1 })
      .then((timeentry) => {
        if (timeentry === undefined || timeentry.length === 0 || timeentry.length > 1) {
          // reject(new Error('No Time Entry found for given date : ' + date))
          resolve(undefined);
        } else if (timeentry.length > 1) {
          // reject(new Error('More then 1 last time entry found, which is absurd! Given date : ' + date))
          resolve(undefined);
        } else {
          resolve(timeentry[0]);
        }
      })
      .catch(err => reject(new Error(`Unable to read Time Entry for given date : ${dt} (${err.message})`)));
  });
};

exports.getFirstTimeEntry = () => new Promise((resolve, reject) => {
  TimeEntry.aggregate([{
    $group: {
      _id: 0,
      age: {
        $min: '$entry_date',
      },
    },
  }])
    .then((timeentries) => {
      resolve(timeentries[0]);
    })
    .catch(err => reject(new Error(`${'Unable to read first Time Entry: ' + ' ('}${err.message})`)));
});

exports.getLastTimeEntry = () => new Promise((resolve, reject) => {
  TimeEntry.aggregate([{
    $group: {
      _id: 0,
      age: {
        $max: '$entry_date',
      },
    },
  }])
    .then((timeentries) => {
      resolve(timeentries[0]);
    })
    .catch(err => reject(new Error(`${'Unable to read last Time Entry: ' + ' ('}${err.message})`)));
});

exports.removeDoublets = () => {
  let lastTimeentry;
  let count = 0;

  return new Promise((resolve, reject) => {
    TimeEntry.find().sort({
      entry_date: 1,
    })
      .then((timeEntries) => {
        timeEntries.forEach((timeentry) => {
          if (lastTimeentry !== undefined) {
            if (moment(timeentry.entry_date).diff(lastTimeentry.entry_date) < 1000 && // .diff -> milliseconds; < 1000 less than one second
              timeentry.direction == lastTimeentry.direction) {
              timeentry.remove();
              count++;
              console.log(`removing timeentry ${timeentry}`);
            } else {
              lastTimeentry = timeentry;
            }
          } else {
            lastTimeentry = timeentry;
          }
        });
      })
      .catch(err => reject(err));
    console.log(`${count} doublets removed`);
    resolve({ removed: count });
  });
};

exports.sleep = (delay) => {
  console.log(`I 'm going to sleep now for ${delay} ms`);
  return new Promise(resolve => setTimeout(resolve, delay));
};
