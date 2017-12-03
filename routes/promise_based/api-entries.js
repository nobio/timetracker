var mongoose = require('mongoose')
var moment = require('moment')
var tz = require('moment-timezone')
var util = require('./util')
var TimeEntry = mongoose.model('TimeEntry')
const DEFAULT_BREAK_TIME = 45 * 60 * 1000 // 45 min in milli seconds

/********************************************************************************
 * Get one Time Entry by it's id
 * 
 * curl -X GET http://localhost:30000/entries/5a2100cf87f1f368d087696a
 *******************************************************************************/
exports.getEntryById = (req, res) => {
  TimeEntry.findById(req.params.id)
    .then(timeentry => res.send(timeentry))
    .catch(err => res.send(500, 'Error while reading Time Entry: ' + req.params.id + ' ' + err))
}

/********************************************************************************
 * Reads all time entries
 * Read entries by date: getAllByDate
 * Read busy time: getBusyTime
 *
 * curl -X GET http://localhost:30000/api/entries
 * curl -X GET http://localhost:30000/api/entries?dt=1393455600000
 * curl -X GET http://localhost:30000/api/entries?busy=1393455600000
 *******************************************************************************/
exports.getEntries = (req, res) => {
  var filterByDate = req.query.dt
  var filterByBusy = req.query.busy

  if (filterByDate && filterByBusy) {
    console.log('filter by date and busy')
    res.send(500, 'date and busy filter set; can only handle one of them')
  } else if (filterByDate) {
    console.log('filter by date: ' + filterByDate)
    getAllByDate(filterByDate)
      .then(timeentries => res.send(timeentries))
      .catch(err => res.send(500, err))
  } else if (filterByBusy) {
    console.log('filter by busy: ' + filterByBusy)
    getAllByDate(filterByBusy)
      .then(getBusyTime)
      .then(busytime => res.send({'duration': busytime}))
      .catch(err => res.send(500, err))
  } else {
    TimeEntry.find()
      .then(timeentry => res.send(timeentry))
      .catch(err => res.send(500, 'Error while reading Time Entry: ' + req.params.id + ' ' + err))
  }
}

/********************************************************************************
 * Creates a new TimeEntry value. Input data:
 * @param direction (enter/go)
 * @param entry_date
 * @param last_changed
 * @param date_time
 * @param longitude (optional)
 * @param latitude (optional)
 * 
 * curl -X POST -H "Content-Type: application/json" -d '{"direction":"enter","entry_date":"2017-12-02T17:49:23.977Z","last_changed":"2017-12-02T17:49:23.977Z","datetime":"2017-12-02T17:49:00.000Z"}' http://localhost:30000/api/entries
 *******************************************************************************/
exports.createEntry = (req, res) => {
  console.log(JSON.stringify(req.body))
  var direction = req.body.direction
  var datetime = req.body.datetime
  var longitude = req.body.longitude
  var latitude = req.body.latitude

  // TODO: make util.createTimeEntry use Promise
  // util.createTimeEntry -> util.validateRequest -> util.getLastTimeEntryByDate
  // util.getLastTimeEntryByDate().
  //   then(util.validateRequest).
  //   then(util.createTimeEntry).
  //   catch(err => {})
  util.createTimeEntry(direction, datetime, longitude, latitude, (err, timeentry) => {
    if (err) {
      res.send(500, 'Error while creating new  Time Entry: ' + err.message)
    } else {
      res.send(timeentry)
    }
  })
}

/********************************************************************************
 * deletes one time entry by it's id
 * 
 * curl -X DELETE http://localhost:30000/api/entries/5a24076af89b40156b1c0efe
 *******************************************************************************/
exports.deleteEntry = (req, res) => {
  var id = req.params.id

  TimeEntry.findByIdAndRemove(id)
    .then(timeentry => res.send(timeentry))
    .catch(err => res.send(500, 'Error while reading Time Entry: ' + req.params.id + ' ' + err))
}

/********************************************************************************
 * stores one Time Entry
 *******************************************************************************/
exports.storeEntryById = (req, res) => {
}

/* =========================================================================== */
/* =========================================================================== */
/*                              PRIVATE METHODS                                */
/* =========================================================================== */
/* =========================================================================== */

/**
 * lists all Time Entries for a given date (this particular day)
 * 
 * @returns Promise
 */
function getAllByDate (date) {
  var dtStart = util.stripdownToDateBerlin(moment.unix(date / 1000))
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
 * 
 * @returns Promise
 */
function getBusyTime (timeentries) {
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
