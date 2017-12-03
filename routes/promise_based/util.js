/**
 * 
 * Methods of this file must never be used from server.js directly rather than from api layer
 * 
 */

require('../../db/db')
var mongoose = require('mongoose')
var moment = require('moment')
var TimeEntry = mongoose.model('TimeEntry')

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
