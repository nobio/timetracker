const moment = require('moment-timezone');
const logger = require('../config/logger'); // Logger configuration
const utilEntry = require('../entries/util-entries');

/**
 *
 * @param {Number} interval
 * @param {String} direction: undefined (both), enter, go
 */
exports.getHistogramByTimeUnit = (interval, direction) => new Promise((resolve, reject) => {
  if (interval < 1) {
    reject(new Error('interval must not be less 1'));
    return;
  }
  const data = [];
  const numberElementsPerHour = 1440 / interval;
  // prepare data structure regarding the interval. I.e. if interval = 60 (min) we create a structure with 24 entries (1440 min / 60 min = 24)
  for (let t = 0; t < numberElementsPerHour; t++) {
    data.push({
      time: moment(1000 * 60 * t * interval),
      histValue: 0.0,
    });
  }

  utilEntry.getAll()
    .then((timeEntries) => calculateHistogram(timeEntries, interval, direction, data))
    .then((filledData) => resolve(data))
    .catch((err) => reject(err));
});

/**
 * Iterates over all Time Entries, takes the "entry_date"-value, searches the corresponding time interval in data structure
 * and increments the value by 1
 *
 * @param {Array} timeEntries All Time Entries
 * @param {number} interval Interval
 * @param {String} direction: undefined (both), enter, go
 * @param {JSON} data Structure containing the correct number of entries; to be filled with historgram values
 */
function calculateHistogram(timeEntries, interval, direction, data) {
  let tm;
  let idx;

  return new Promise((resolve, reject) => {
    timeEntries.forEach((timeEntry) => {
      if (!direction || (direction && (direction === timeEntry.direction))) {
        tm = getTimeInMinutes(timeEntry.entry_date);
        idx = (tm / interval | 0);
        data[idx].histValue++;
      }
    });

    resolve(data);
  });
}

/**
 * counts the minute from a given date string (ignores the day, month, year but also seconds and miliseconds)
 * @param {*} entryDate
 */
function getTimeInMinutes(entryDate) {
  const t = moment.tz(entryDate, 'Europe/Berlin');
  // moment.tz(stat.date, 'Europe/Berlin');
  return t.hours() * 60 + t.minutes();
}
