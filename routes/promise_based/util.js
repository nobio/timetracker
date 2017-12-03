/**
 * 
 * Methods of this file must never be used from server.js directly rather than from api layer
 * 
 */
console.log('util in promise realm was started')
require('../../db/db')

var mongoose = require('mongoose')
var moment = require('moment')
var TimeEntry = mongoose.model('TimeEntry')
const DEFAULT_BREAK_TIME = 45 * 60 * 1000 // 45 min in milli seconds

/**
 * takes the date and removes all time components
 * date expected to be a moment object
 */
exports.stripdownToDateBerlin = (date) => {
  var d = moment.tz(date / 1, 'Europe/Berlin')
  d.millisecond(0)
  d.second(0)
  d.minutes(0)
  d.hours(0)

  return d
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
