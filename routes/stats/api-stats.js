const util = require('./util-stats');

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
 * curl -X GET http://localhost:30000/api/statistics/aggregate?timeUnit=day
 * curl -X GET http://localhost:30000/api/statistics/aggregate?timeUnit=week
 * curl -X GET http://localhost:30000/api/statistics/aggregate?timeUnit=month
 * curl -X GET http://localhost:30000/api/statistics/aggregate?timeUnit=weekday
 */
exports.getStatsByTimeBox = (req, res) => {
  util.getStatsByTimeBox(req.query.timeUnit)
    .then(timeentry => res.status(200).send(timeentry))
    .catch(err => res.status(500).send(`Error while reading statistics: ${req.params.id} ${err}`));
};