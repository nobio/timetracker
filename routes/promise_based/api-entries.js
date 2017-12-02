var mongoose = require('mongoose')
var moment = require('moment')
var tz = require('moment-timezone')
var util = require('./util')
var TimeEntry = mongoose.model('TimeEntry')

/*
 * Creates a new TimeEntry value. Input data:
 * - direction (enter/go)
 * - entry_date
 * - last_changed
 * - date_time
 * - longitude (optional)
 * - latitude (optional)
 * 
 * curl -X POST -H "Content-Type: application/json" -d '{"direction":"enter","entry_date":"2017-12-02T17:49:23.977Z","last_changed":"2017-12-02T17:49:23.977Z","datetime":"2017-12-02T17:49:00.000Z"}' http://localhost:30000/api/entries
 */
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
/*
 * deletes one time entry by it's id
 */
exports.deleteEntry = (req, res) => {
  var id = req.params.id

  TimeEntry.findByIdAndRemove(id, (err) => {
    if (err) {
      res.send(500, 'Error while deleting Time Entry: ' + id + ' ' + err.message)
    } else {
      res.send(id)
    }
  })
}

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
}

/*
 * lists all Time Entries for a given date (this particular day)
 *
 * curl -X GET http://localhost:30000/entries/dt/1451084400000
 */
function getAllByDate (date, res) {
}

/*
 * get one Time Entry by it's id
 */
exports.getEntryById = (req, res) => {

  TimeEntry.findById(req.params.id, (err, timeentry) => {
    if (err) {
      res.send(500, 'Error while reading Time Entry: ' + req.params.id + ' ' + err)
    } else {
      res.send(timeentry)
    }
  })
}
/*
 * stores one Time Entry
 */
exports.storeEntryById = (req, res) => {
}
