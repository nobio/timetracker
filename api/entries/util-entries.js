/**
 *
 * Methods of this file must never be used from server.js directly rather than from api layer
 *
 */
require('../../db');
const g_util = require('../global_util');
const auth_util = require('../auth/util-auth');
const moment = require('moment');
const mongoose = require('mongoose');

const TimeEntry = mongoose.model('TimeEntry');
const FailureDay = mongoose.model('FailureDay');

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
 * takes the date and removes all time components
 * date expected to be a moment object
 */
exports.stripdownToDateUTC = (date) => {
  const d = moment.tz(date / 1, 'WET');
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
exports.findById = id =>
  // console.log('entered findById ' + id)
  new Promise((resolve, reject) => {
    TimeEntry.findById(id)
      .then(timeentries => resolve(timeentries))
      .catch(err => reject(err));
  });


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
exports.create = async (timeEntry) => {
  if (!timeEntry) throw new Error('to update a record, the passed object must not be undefined');
  if (!timeEntry.datetime) timeEntry.datetime = moment();

  // ============== 1st check: Last Time Entry ==============
  const lastTimeEntry = await this.getLastTimeEntryByDate(timeEntry.datetime);
  // console.log(JSON.stringify(timeEntry));
  if (!lastTimeEntry) { // no entry today -> direction must be 'enter'
    if (timeEntry.direction != 'enter') {
      throw new Error(`first entry of the day must be an enter and not ${timeEntry.direction}`);
      return;
    }
  } else if (lastTimeEntry.direction === timeEntry.direction) { // entry already exists -> direction must be opposite
    throw new Error(`this entry has direction ${timeEntry.direction} but last entry has also direction ${lastTimeEntry.direction}`);
    return;
  }

  // ============== 2nd check: is the new entry really a new entry or does it already exist? ==============
  try {
    const entriesByDate = await this.getAllByDate(moment(timeEntry.datetime));
    console.log(entriesByDate)
    entriesByDate.forEach(entry => {
      if (entry.entry_date.toISOString() == timeEntry.datetime &&
        entry.direction == timeEntry.direction) {
        console.error(`entry already exists; use update to modify`);
        throw new Error(`entry already exists; use update to modify`);
      }
    });
      
  } catch (error) {
    console.log(error)
    throw error;    
  }

  return new Promise((resolve, reject) => {
    // all checks successfully done, lets create the TimeEntry!
    new TimeEntry({
      entry_date: timeEntry.datetime,
      direction: timeEntry.direction,
      longitude: timeEntry.longitude,
      latitude: timeEntry.latitude,
    }).save()
      .then((tEntry) => {
        // in case the external URL is given, use it to render a deep link
        const msg = ((process.env.EXTERNAL_DOMAIN) ? `http://${process.env.EXTERNAL_DOMAIN}/?dl=entryId:${tEntry._id}` : JSON.stringify(timeEntry));
        g_util.sendMessage('CREATE_ENTRY', msg);
        return tEntry;
      })
      .then(tEntry => resolve(tEntry))
      .catch((err) => {
        g_util.sendMessage('CREATE_ENTRY', `could not create new entry: ${err.message}`);
        reject(err);
      });
  })
    .catch(err => reject(err));

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
      .then(g_util.sendMessage('DELETE_ENTRY', id))
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
  //console.log(timeentries);

  if (timeentries.length === 0) {
    // reject(new Error(`Es gibt keine Einträge für diesen Tag (${dt.format('DD.MM.YYYY')})`), 0);
    resolve([]);
    //  } else if (timeentries.length % 2 !== 0) {
  } else if (timeentries.length % 2 !== 0 && (moment().format('DD.MM.YYYY') !== moment(timeentries[timeentries.length - 1].last_changed).format('DD.MM.YYYY'))) {
    latestTimeEntry = timeentries[timeentries.length - 1];
    /*
    console.log(moment().format('DD.MM.YYYY'));
    console.log(moment(latestTimeEntry.last_changed).format('DD.MM.YYYY'));
    if (moment().format('DD.MM.YYYY') === moment(latestTimeEntry.last_changed).format('DD.MM.YYYY')) {
      console.log(latestTimeEntry);
    }
    */
    reject(new Error('Bitte die Einträge für vervollständigen'), 0);
  } else {
    let busytime = 0;
    let pause = 0;
    const lastTimeEntry = timeentries[timeentries.length - 1];

    if (timeentries.length % 2 !== 0 && (moment().format('DD.MM.YYYY') === moment(lastTimeEntry.last_changed).format('DD.MM.YYYY'))) {
      timeentries.push(new TimeEntry({
        entry_date: moment().toISOString(),
        last_changed: moment().toISOString(),
        direction: 'go',
      }))
    }

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
      busytime -= g_util.DEFAULT_BREAK_TIME_MILLISECONDS;
      pause = g_util.DEFAULT_BREAK_TIME_MILLISECONDS;
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
  TimeEntry.find().sort({ entry_date: 1 })
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
              // console.log(`removing timeentry ${timeentry}`);
            } else {
              lastTimeentry = timeentry;
            }
          } else {
            lastTimeentry = timeentry;
          }
        });
      })
      .catch(err => reject(err));
    // console.log(`${count} doublets removed`);
    resolve({ removed: count });
  });
};

exports.sleep = (delay) => {
  console.log(`I 'm going to sleep now for ${delay} ms`);
  return new Promise(resolve => setTimeout(resolve, delay));
};

exports.evaluate = () =>
  new Promise((resolve, reject) => {
    let firstEntry;
    let lastEntry;

    this
      .getFirstTimeEntry()
      .then(firstTimeEntry => (firstEntry = firstTimeEntry))
      .then(firstTimeEntry => this.getLastTimeEntry())
      .then(lastTimeEntry => (lastEntry = lastTimeEntry))
      .then(result => FailureDay.deleteMany())
      .then(result => this.storeValidationErrors(firstEntry, lastEntry))
      .then(result => resolve(result))
      .then(g_util.sendMessage('EVALUATE_DATA'))
      .catch(err => reject(err));
  });

exports.storeValidationErrors = (firstEntry, lastEntry) =>
  new Promise((resolve, reject) => {
    // console.log(JSON.stringify(firstEntry), lastEntry);
    const lastEntriesAge = moment(lastEntry.age);
    const date = this.stripdownToDateUTC(firstEntry.age);

    for (let d = date; d < moment(lastEntry.age); date.add(1, 'day')) {
      // console.log(`calculating for day ${date.format('YYYY-MM-DD')}`);
      const dt = moment(date);

      this.getAllByDate(dt).then((timeentries) => {
        // firstly evaluate the not (yet) complete entries and save them....
        if (timeentries.length % 2 !== 0) {
          new FailureDay({
            date: dt,
            failure_type: 'INCOMPLETE',
          }).save((err) => {
            if (err) {
              reject(err);
            }
          });
        }

        // sencondly evaluate on wrong order of entries and save them too
        for (let n = timeentries.length - 1; n > 0; n -= 2) {
          // this must be a go-event to be good. Otherwise report a failure
          if (timeentries[n].direction !== 'go') {
            new FailureDay({
              date: dt.toDate(),
              failure_type: 'WRONG_ORDER',
            }).save((err) => {
              if (err) {
                reject(err);
              }
            });
          }
        }
      });
    }
    resolve({ message: 'calculation ongoing in background' });
  });

/**
   * read all error dates from database; delivers an array like
   *
   * [
   *     {
   *       "error-type" : "WRONG_ORDER",
   *       "error-date" : "2019-11-24T00:00:00.000Z"
   *    },
   *    {
   *       "error-type" : "INCOMPLETE",
   *       "error-date" : "2019-12-12T00:00:00.000Z"
   *    }
   * ]
   */
exports.getErrorDates = () => new Promise((resolve, reject) => {
  FailureDay.find().sort({ failure_type: 1, date: -1 })
    .then((failureDates) => {
      const fDates = [];
      for (let n = 0; n < failureDates.length; n++) {
        fDates.push({
          'error-date': failureDates[n].date,
          'error-type': failureDates[n].failure_type,
        });
      }
      resolve(fDates);
    })
    .catch(err => reject(err));
});

