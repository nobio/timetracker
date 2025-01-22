/* eslint-disable camelcase */
const utilStats = require('./util-stats');
const utilTimebox = require('./util-statstimebox');
const utilHistogram = require('./util-histogram');
const utilBreaktime = require('./util-breaktime');
const utilExtraHours = require('./util-extrahours');

/**
 * calculates the statistics for today +/- one month and stores them in database
 *
 * curl -X PUT http://localhost:30000/api/stats
 */
exports.calcStats = (req, res) => {
  utilStats.calcStats()
    .then((timeentry) => res.status(200).send(timeentry))
    .catch((err) => res.status(500).send(`Error while reading Time Entry: ${err}`));
};

/**
 * returns the aggregated statistics for a given time day
 *
 * @param req.params.date timestamp in nano seconds
 *  curl -X GET http://localhost:30000/api/stats/1391295600000/month?fill=true
 */
exports.getStats = (req, res) => {
  const dtStart = req.params.date;
  const { timeUnit } = req.params;
  const { accumulate, fill } = req.query;

  utilStats.getStats(timeUnit, dtStart, accumulate, fill)
    .then((timeentries) => {
      res.status(200).send(timeentries);
    })
    .catch((err) => res.status(500).send(`Error while reading Time Entry: ${req.params.id} ${err}`));
};

/**
 * deletes all StatsDay-items from database. This should only be used during development time
 * and later either deleted or put behind some special user privileges
 *
 * curl -X DELETE http://localhost:30000/api/stats
 */
exports.deleteAllStatsDays = (req, res) => {
  utilStats.deleteAllStatsDays()
    .then((result) => res.status(200).send(result))
    .catch((err) => res.status(500).send(`Error while deleting Time Entries: ${req.params.id} ${err}`));
};

/**
 * curl -X GET http://localhost:30000/api/statistics/aggregate?timeUnit=day
 * curl -X GET http://localhost:30000/api/statistics/aggregate?timeUnit=week
 * curl -X GET http://localhost:30000/api/statistics/aggregate?timeUnit=month
 * curl -X GET http://localhost:30000/api/statistics/aggregate?timeUnit=weekday
 */
exports.getStatsByTimeBox = (req, res) => {
  const { timeUnit } = req.query;

  utilTimebox.getStatsByTimeBox(timeUnit)
    .then((timeboxedStatistics) => {
      const chart_data = {
        xScale: ((timeUnit === 'day' || timeUnit === 'week') ? 'time' : 'ordinal'),
        yScale: 'linear',
        yMin: '5',
        type: ((timeUnit === 'day' || timeUnit === 'week') ? 'line' : 'bar'),
        main: [{
          data: timeboxedStatistics.inner_data,
        }],
        comp: [{
          type: 'line',
          data: timeboxedStatistics.inner_comp,
        }],
      };

      console.log(JSON.stringify(timeboxedStatistics));
      res.send({
        actual_working_time: timeboxedStatistics.actual_working_time,
        planned_working_time: timeboxedStatistics.planned_working_time,
        average_working_time: timeboxedStatistics.average_working_time,
        chart_data,
      });
    })
    .catch((err) => res.status(500).send(`Error while reading Time Boxed Entries: ${err.message}`));
};

/**
 * curl -X GET http://localhost:30000/api/statistics/histogram/60
 * curl -X GET http://localhost:30000/api/statistics/histogram/60?direction=enter
 * curl -X GET http://localhost:30000/api/statistics/histogram/60?direction=go
 *
 * @param {*} req
 * @param {*} res
 */
exports.histogram = (req, res) => {
  const { interval } = req.params;
  const { direction } = req.query;

  utilHistogram.getHistogramByTimeUnit(interval, direction)
    .then((data) => res.status(200).send(data))
    .catch((err) => res.status(500).send(`Error while reading histogram of Time Entries for given interval (${interval}): ${err.message}`));
};

/**
 * curl -X GET http://localhost:30000/api/statistics/breaktime/10
 * curl -X GET http://localhost:30000/api/statistics/breaktime/10?real=true
 * curl -X GET http://localhost:30000/api/statistics/breaktime/10?real=false
 *
 * @param {*} req
 * @param {*} res
 */
exports.breaktime = (req, res) => {
  const interval = parseInt(req.params.interval, 10);
  const realCalc = (!req.query.real || req.query.real === '' ? false : req.query.real.toLowerCase() === 'true');

  if (!interval || interval === '0') {
    res.status(500).send('invalid interval; must be numeric and > 0');
  } else {
    utilBreaktime.getBreakTime(interval, realCalc)
      .then((data) => res.status(200).send(data))
      .catch((err) => res.status(500).send(`Error while reading break time data with parameter realCalc (${realCalc}): ${err.message}`));
  }
};

/**
 * curl -X GET http://localhost:30000/api/statistics/extrahours?accumulate=false
 * curl -X GET http://localhost:30000/api/statistics/extrahours?accumulate=true
 *
 * @param {*} req
 * @param {*} res
 */
exports.extraHours = (req, res) => {
  const acc = (req.query.accumulate === 'true');
  const { timeUnit, startDate } = req.query;

  utilExtraHours.getExtraHours(acc, timeUnit, startDate)
    .then((data) => res.status(200).send(data))
    .catch((err) => res.status(403).send(`Error while reading extra hoursbreak with parameter acc (${acc}): ${err.message}`));
};
