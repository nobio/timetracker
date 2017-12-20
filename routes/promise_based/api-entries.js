var util = require('./util-entries')
const DEFAULT_BREAK_TIME = 45 * 60 * 1000 // 45 min in milli seconds

/********************************************************************************
 * Get one Time Entry by it's id
 * 
 * curl -X GET http://localhost:30000/api/entries/5a2100cf87f1f368d087696a
 *******************************************************************************/
exports.getEntryById = (req, res) => {
  util.findById(req.params.id)
    .then(timeentry => res.send(timeentry))
    .catch(err => res.send(500, 'Error while reading Time Entry: ' + req.params.id + ' ' + err))
}

/********************************************************************************
 * Reads all time entries
 * Read entries by date: getAllByDate -> List of Time Entry of the given day
 * Read busy time: getBusyTime -> Busy Time of the given day (in ms)
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
    util.getAllByDate(filterByDate)
      .then(timeentries => res.send(timeentries))
      .catch(err => res.send(500, err))
  } else if (filterByBusy) {
    console.log('filter by busy: ' + filterByBusy)
    util.getAllByDate(filterByBusy)
      .then(util.getBusyTime)
      .then(busytime => res.send({'duration': busytime}))
      .catch(err => res.send(500, err))
  } else {
    util.getAll()
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
 * curl -X POST -H "Content-Type: application/json" -d '{"direction":"enter","datetime":"2017-12-02T17:49:00.000Z"}' http://localhost:30000/api/entries
 * curl -X POST -H "Content-Type: application/json" -d '{"direction":"enter","datetime":"2017-12-02T17:49:00.000Z","longitude":45, "latitude":15}' http://localhost:30000/api/entries
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
  util.create(direction, datetime, longitude, latitude)
    .then(timeentry => res.send(timeentry))
    .catch(err => res.send(500, 'Error while createing a new Time Entry: ' + req.params.id + ' ' + err))
}

/********************************************************************************
 * stores one Time Entry
 *
 * curl -X PUT -H "Content-Type: application/json" -d '{"direction":"enter", "latitude":"45", "longitude":"45"}' http://localhost:30000/api/entries/5a36aab25ba9cf154bd2a384
 *******************************************************************************/
exports.saveEntry = (req, res) => {
  var id = req.params.id
  var direction = req.body.direction
  var datetime = req.body.datetime
  var longitude = req.body.longitude
  var latitude = req.body.latitude

  util.update(undefined, id, direction, datetime, longitude, latitude)
    .then(timeentry => res.send(timeentry))
    .catch(err => res.send(500, 'Error while saving Time Entry: ' + id + ' ' + err))
}

/********************************************************************************
 * deletes one time entry by it's id
 * 
 * curl -X DELETE http://localhost:30000/api/entries/5a24076af89b40156b1c0efe
 *******************************************************************************/
exports.deleteEntry = (req, res) => {
  var id = req.params.id

  util.deleteById(id)
    .then(timeentry => {
      if (timeentry === empty) {
        res.send(500, 'Could not delete Time Entry with (id: ' + id + ') ' + err)
      } else {
        res.send(timeentry)
      }
    })
    .catch(err => res.send(500, 'Error while reading Time Entry: ' + req.params.id + ' ' + err))
}
