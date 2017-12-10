/**
 * 
 * Methods of this file must never be used from server.js directly rather than from api layer
 * 
 */
console.log('util in promise realm was started')
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
  d.millisecond(0); d.second(0); d.minutes(0); d.hours(0)
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
  //console.log('entered findById ' + id)
  return new Promise((resolve, reject) => {
    TimeEntry.findById(id)
      .then(timeentries => resolve(timeentries))
      .catch(err => reject(err))
  })
}

/**
 * Creates a new TimeEntry item in database
 * 
 * @param direction enter/go
 * @param datetime (optional; default = now) the date (example: new Date() or moment(...)) of this TimeEntry
 * @param longitude (optional) the longitude of this TimeEntry
 * @param latitude (optional) the latitude of this TimeEntry
 * @returns new TimeEntry object
 */
exports.save = (direction, datetime, longitude, latitude) => {
  // console.log('entered save ' + id)
  return new Promise((resolve, reject) => {
    new TimeEntry({
      entry_date: datetime,
      direction: direction,
      longitude: longitude,
      latitude: latitude
    }).save()
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
  //console.log('entered deleteById ' + id)
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
  // console.log('getAllByDate received date:               ' + moment(dt).format('DD.MM.YYYY HH:mm:ss'))

  return new Promise((resolve, reject) => {
    TimeEntry.find({
      entry_date: {
        $gte: dtStart,
        $lt: dtEnd
      }
    }).skip(0).sort({
      entry_date: 1
    })
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
