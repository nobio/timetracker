var util = require('./util-stats')

/**
 * calculates the statistics for today +/- one month and stores them in database
 *
 * curl -X PUT http://localhost:30000/api/stats
 */
exports.calcStats = (req, res) => {
    util.calcStats()
      .then(timeentry => res.status(200).send(timeentry))
      .catch(err => res.status(500).send('Error while reading Time Entry: ' + req.params.id + ' ' + err))
}

/**
 * returns the aggregated statistics for a given time day
 *
 *  curl -X GET http://localhost:30000/api/stats/1391295600000?timeUnit=month
 */
exports.getStatsDay = (req, res) => {
    util.findById(req.params.id)
      .then(timeentry => res.status(200).send(timeentry))
      .catch(err => res.status(500).send('Error while reading Time Entry: ' + req.params.id + ' ' + err))
}

/**
 * deletes all StatsDay-items from database. This should only be used during development time
 * and later either deleted or put behind some special user privileges
 *
 * curl -X DELETE http://localhost:30000/stats
 */
exports.deleteAllStatsDays = (req, res) => {
    util.findById(req.params.id)
      .then(timeentry => res.status(200).send(timeentry))
      .catch(err => res.status(500).send('Error while reading Time Entry: ' + req.params.id + ' ' + err))
}

/** 
 * curl -X GET http://localhost:30000/statistics/aggregate?timeUnit=day
 * curl -X GET http://localhost:30000/statistics/aggregate?timeUnit=week
 * curl -X GET http://localhost:30000/statistics/aggregate?timeUnit=month
 * curl -X GET http://localhost:30000/statistics/aggregate?timeUnit=weekday
 */
exports.getStatsByTimeBox = (req, res) => {
    util.findById(req.params.id)
      .then(timeentry => res.status(200).send(timeentry))
      .catch(err => res.status(500).send('Error while reading Time Entry: ' + req.params.id + ' ' + err))
}
