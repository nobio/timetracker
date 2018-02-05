/**
 * 
 * Methods of this file must never be used from server.js directly rather than from api layer
 * 
 */
require('../../db/db')

var mongoose = require('mongoose')
var TimeEntry = mongoose.model('TimeEntry')
var moment = require('moment')
const DEFAULT_BREAK_TIME = 45 * 60 * 1000 // 45 min in milli seconds

exports.isEmpty = (obj) => {
  return require('../util').isEmpty(obj)
}

/**
 * takes the date and removes all time components
 * date expected to be a moment object
 */
exports.stripdownToDateBerlin = (date) => {
  var d = moment.tz(date / 1, 'Europe/Berlin')
  d.millisecond(0);
  d.second(0);
  d.minutes(0);
  d.hours(0)
  return d
}

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
exports.findById = (id) => {
  // console.log('entered findById ' + id)
  return new Promise((resolve, reject) => {
    TimeEntry.findById(id)
      .then(timeentries => resolve(timeentries))
      .catch(err => reject(err))
  })
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
      .then(lastTimeEntry => {
        //console.log(timeEntry);
        if (!lastTimeEntry) { // no entry today -> direction must be 'enter'
          if (timeEntry.direction != 'enter') {
            reject(new Error('first entry of the day must be an enter and not ' + timeEntry.direction))
          }
  
        } else {
          if (lastTimeEntry.direction == timeEntry.direction) {  // entry already exists -> direction must be opposite
            reject(new Error('this entry has direction ' + timeEntry.direction + ' but last entry has also direction ' + lastTimeEntry.direction))
          }
          const now = moment();
          const entryDate = moment(lastTimeEntry.entry_date);
          const timelapse = now - entryDate;
          //console.log(timelapse + ' ms or ' + timelapse / 1000 + ' sec')
          if(timelapse < 1000 * 1) {    // not longer than 1 sec
            reject(new Error('this seems to be a double entry since the last item and this one are created within ' + timelapse + ' ms'));
          }
        }
        
        // all checks successfully done, lets create the TimeEntry!
        new TimeEntry({
            entry_date: timeEntry.datetime,
            direction: timeEntry.direction,
            longitude: timeEntry.longitude,
            latitude: timeEntry.latitude
          }).save()
          .then(tEntry => resolve(tEntry))
          .catch(err => reject(err))
      })
      .catch(err => reject(err))
  })
}

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
//exports.update = (timeEntry, id, direction, datetime, longitude, latitude) => {
exports.update = (timeEntry) => {
  //console.log('entered update with all parameters of Time Entry: ' + timeEntry)
  if (!timeEntry) {
    throw new Error('to update a record, the passed object must not be undefined');
  }

  return new Promise((resolve, reject) => {
    TimeEntry.findById(timeEntry.id)
      .then(te => {
        // console.log(timeentry)
        te.direction = timeEntry.direction
        te.longitude = timeEntry.longitude
        te.latitude = timeEntry.latitude
        te.datetime = timeEntry.datetime
        te.last_changed = new Date()
        // console.log(timeentry)
        return timeEntry;
      })
      .then(timeEntry => timeEntry.save())
      .then(timeEntry => resolve(timeEntry))
      .catch(err => reject(err))
  })
}

/**
 * deletes one entry by it's id
 * @param id unique id of an entry like 5a2100cf87f1f368d087696a
 * @returns TimeEntry object that has been deleted
 */
exports.deleteById = (id) => {
  // console.log('entered deleteById ' + id)
  return new Promise((resolve, reject) => {
    TimeEntry.findByIdAndRemove(id)
      .then(timeentry => resolve(timeentry))
      .catch(err => reject(err))
  })
}

/**
 * lists all Time Entries for a given date (this particular day)
 * 
 * @returns Promise
 */
exports.getAllByDate = (date) => {
  var dtStart = this.stripdownToDateBerlin(moment.unix(date / 1000))
  var dtEnd = moment(dtStart).add(1, 'days')
  // console.log('getAllByDate received date: ' + moment(dtStart).format('DD.MM.YYYY HH:mm:ss') + ' - ' + moment(dtEnd).format('DD.MM.YYYY HH:mm:ss'))

  return new Promise((resolve, reject) => {
    TimeEntry.find({
        entry_date: {
          $gte: dtStart,
          $lt: dtEnd
        }
      }).skip(0).sort({ entry_date: 1 })
      .then(timeentries => resolve(timeentries))
      .catch(err => reject(new Error('Unable to read Time Entry for given date : ' + date + ' (' + err.message + ')')))
  })
}

/**
 * Reads the busy time of all entries for a given day
 * @param list of time entry objects (usually 2) from getAllByDate method
 * @returns Promise
 */
exports.getBusyTime = (timeentries) => {
  return new Promise((resolve, reject) => {

    if (timeentries.length === 0) {
      reject(new Error('Es gibt keine Einträge für diesen Tag (' + dt.format('DD.MM.YYYY') + ')'), 0)
    } else if (timeentries.length % 2 !== 0) {
      reject(new Error('Bitte die Einträge für diesen Tag (' + dt.format('DD.MM.YYYY') + ') vervollständigen'), 0)
    } else {
      var busytime = 0
      for (var n = timeentries.length - 1; n > 0; n -= 2) {
        // this must be a go-event
        if (timeentries[n].direction !== 'go') {
          reject(new Error('Die Reihenfolge der Kommen/Gehen-Einträge am ' + dt.format('DD.MM.YYYY') + ' scheint nicht zu stimmen.'), 0)
          return
        }

        var end = timeentries[n].entry_date
        var start = timeentries[n - 1].entry_date

        busytime = busytime + (end - start)
      }

      // when there have been only 2 entries we reduce the busytime by 45 minutes (default pause)
      if (timeentries.length === 2) {
        busytime = busytime - DEFAULT_BREAK_TIME
      }
      // console.log(dt + " => " + busytime + " " + (busytime/1000/60/60))

      resolve(busytime)
    }
  })
}

/**
 * reads the last entry for a given date
 * 
 * @param dt (*) Date to which the last entry is to be read; example: "2017-12-19T19:34:00.000Z"
 * @returns Promise and then (resolve) last time entry of the given date (no array, ony one TimeEntry)
 */
exports.getLastTimeEntryByDate = (dt) => {
  var dtStart = this.stripdownToDateBerlin(dt)
  var dtEnd = moment(dtStart).add(1, 'days')

  // console.log(dtStart.toDate() + '\n' + dtEnd.toDate())

  return new Promise((resolve, reject) => {
    TimeEntry.find({
        entry_date: {
          $gte: dtStart,
          $lt: dtEnd
        }
      }).skip(0).limit(1).sort({ entry_date: -1 })
      .then(timeentry => {
        if (timeentry === undefined || timeentry.length == 0 || timeentry.length > 1) {
          // reject(new Error('No Time Entry found for given date : ' + date))
          resolve(undefined);
        } else if (timeentry.length > 1) {
          // reject(new Error('More then 1 last time entry found, which is absurd! Given date : ' + date))          
          resolve(undefined);
        } else {
          resolve(timeentry[0])
        }
      })
      .catch(err => reject(new Error('Unable to read Time Entry for given date : ' + dt + ' (' + err.message + ')')))
  })
}

exports.getAll = () => {
  return new Promise((resolve, reject) => {
    TimeEntry.find()
      .then(timeentries => resolve(timeentries))
      .catch(err => reject(err))
  })
}

exports.sleep = (delay) => {
  console.log("I 'm going to sleep now for " + delay + ' ms')
  return new Promise(resolve => setTimeout(resolve, delay))
}
