const util = require('./util-stats');
const utilTimebox = require('./util-statstimebox');
const utilHistogram = require('./util-histogram');

/**
 * calculates the statistics for today +/- one month and stores them in database
 *
 * curl -X PUT http://localhost:30000/api/stats
 */
exports.calcStats = (req, res) => {
  util.calcStats()
    .then(timeentry => res.status(200).send(timeentry))
    .catch(err => res.status(500).send(`Error while reading Time Entry: ${err}`));
};

/**
 * returns the aggregated statistics for a given time day
 *
 * @param req.params.date timestamp in nano seconds
 *  curl -X GET http://localhost:30000/api/stats/1391295600000?timeUnit=month
 */
exports.getStats = (req, res) => {
  const timeUnit = req.query.timeUnit;
  const dtStart = req.params.date;

  util.getStats(timeUnit, dtStart)
    .then(timeentries => res.status(200).send(timeentries))
    .catch(err => res.status(500).send(`Error while reading Time Entry: ${req.params.id} ${err}`));
};

/**
 * deletes all StatsDay-items from database. This should only be used during development time
 * and later either deleted or put behind some special user privileges
 *
 * curl -X DELETE http://localhost:30000/api/stats
 */
exports.deleteAllStatsDays = (req, res) => {
  util.deleteAllStatsDays()
    .then(result => res.status(200).send(result))
    .catch(err => res.status(500).send(`Error while deleting Time Entries: ${req.params.id} ${err}`));
};

/**
 * curl -X GET http://localhost:30000/statistics/aggregate?timeUnit=day
 * curl -X GET http://localhost:30000/statistics/aggregate?timeUnit=week
 * curl -X GET http://localhost:30000/statistics/aggregate?timeUnit=month
 * curl -X GET http://localhost:30000/statistics/aggregate?timeUnit=weekday
 */
exports.getStatsByTimeBox = (req, res) => {
  const timeUnit = req.query.timeUnit;

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

      res.send({
        actual_working_time: timeboxedStatistics.actual_working_time,
        planned_working_time: timeboxedStatistics.planned_working_time,
        average_working_time: timeboxedStatistics.average_working_time,
        chart_data,
      });
    })
    .catch(err => res.status(500).send(`Error while reading Time Boxed Entries: ${err.message}`));
};

/**
 * curl -X GET http://localhost:30000/api/statisitcs/histogram/60
 * curl -X GET http://localhost:30000/api/statisitcs/histogram/60?direction=enter
 * curl -X GET http://localhost:30000/api/statisitcs/histogram/60?direction=go
 * 
 * @param {*} req 
 * @param {*} res 
 */
exports.histogram = (req, res) => {
  const interval = req.params.interval;
  const direction = req.query.direction

  utilHistogram.getHistogramByTimeUnit(interval, direction)
    .then(data => res.send(data))
    .catch(err => res.status(500).send(`Error while reading histogram of Time Entries for given interval (${interval}): ${err.message}`));
};
