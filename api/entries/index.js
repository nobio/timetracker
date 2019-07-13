const util = require('./util-entries');

// const DEFAULT_BREAK_TIME = 45 * 60 * 1000 // 45 min in milli seconds

/** ******************************************************************************
 * Get one Time Entry by it's id
 *
 * curl -X GET http://localhost:30000/api/entries/5a2100cf87f1f368d087696a
 ****************************************************************************** */
exports.getEntryById = (req, res) => {
  util.findById(req.params.id)
    .then(timeentry => res.status(200).send(timeentry))
    .catch(err => res.status(500).send(`Error while reading Time Entry: ${req.params.id} ${err.message}`));
};

/** ******************************************************************************
 * Reads all time entries
 * Read entries by date: getAllByDate -> List of Time Entry of the given day
 * Read busy time: getBusyTime -> Busy Time of the given day (in ms)
 *
 * curl -X GET http://localhost:30000/api/entries
 * curl -X GET http://localhost:30000/api/entries?dt=1393455600000
 * curl -X GET http://localhost:30000/api/entries?busy=1393455600000
 ****************************************************************************** */
exports.getEntries = (req, res) => {
  const filterByDate = req.query.dt;
  const filterByBusy = req.query.busy;

  if (filterByDate && filterByBusy) {
    console.log('filter by date and busy');
    res.status(500).send('date and busy filter set; can only handle one of them');
  } else if (filterByDate) {
    console.log(`filter by date: ${filterByDate}`);
    util.getAllByDate(filterByDate)
      .then(timeentries => res.status(200).send(timeentries))
      .catch(err => res.status(500).send(err));
  } else if (filterByBusy) {
    console.log(`filter by busy: ${filterByBusy}`);
    util.getAllByDate(filterByBusy)
      .then(util.calculateBusyTime)
      .then(busytime => res.status(200).send(busytime))
      .catch(err => res.status(500).send(err.message));
  } else {
    util.getAll()
      .then(timeentry => res.status(200).send(timeentry))
      .catch(err => res.status(500).send(`Error while reading Time Entry: ${req.params.id} ${err.message}`));
  }
};

/** ******************************************************************************
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
 * curl -X POST -H "Content-Type: application/json" -d '{"direction":"enter","entry_date":"2018-02-18T09:46:02.151Z","last_changed":"2018-02-18T09:46:02.151Z","datetime":"2018-02-18T09:46:00.000Z"}'  http://localhost:30000/api/entries
 ****************************************************************************** */
exports.createEntry = (req, res) => {
  console.log(JSON.stringify(req.body));
  const timeEntry = {
    direction: req.body.direction,
    datetime: req.body.datetime,
    longitude: req.body.longitude,
    latitude: req.body.latitude,
  };

  util.create(timeEntry)
    .then(timeentry => res.status(200).send(timeentry))
    .catch(err => res.status(500).send(`Error while createing a new Time Entry: ${err.message}`));
};

/** ******************************************************************************
 * stores one Time Entry
 *
 * curl -X PUT -H "Content-Type: application/json" -d '{"direction":"enter", "latitude":"45", "longitude":"45"}' http://localhost:30000/api/entries/5a36aab25ba9cf154bd2a384
 ****************************************************************************** */
exports.saveEntry = (req, res) => {
  // console.log(JSON.stringify(req.body))
  const id = req.params.id;
  const timeEntry = {
    id: req.params.id,
    direction: req.body.direction,
    entry_date: req.body.entry_date,
    datetime: req.body.datetime,
    longitude: req.body.longitude,
    latitude: req.body.latitude,
  };

  util.update(timeEntry)
    .then(timeentry => res.status(200).send(timeentry))
    .catch(err => res.status(500).send(`Error while saving Time Entry: ${id} ${err.message}`));
};

/** ******************************************************************************
 * deletes one time entry by it's id
 *
 * curl -X DELETE http://localhost:30000/api/entries/5a24076af89b40156b1c0efe
 ****************************************************************************** */
exports.deleteEntry = (req, res) => {
  const id = req.params.id;

  util.deleteById(id)
    .then((timeentry) => {
      if (timeentry === undefined || timeentry === null) {
        res.status(500).send(`Could not delete Time Entry with (id: ${id})`);
      } else {
        res.status(200).send(timeentry);
      }
    })
    .catch(err => res.status(500).send(`Error while reading Time Entry: ${req.params.id} - ${err.message}`));
};

/*
  {
    device: '0C799CAD-D148-4F05-94EA-A74086AA91E3',
    id: 'Work',
    latitude: '49.51429653451733',
    longitude: '10.87531216443598',
    timestamp: '1401728167.886038',
    trigger: 'exit'
 }
 {
    device: '0C799CAD-D148-4F05-94EA-A74086AA91E3',
    id: 'Work',
    latitude: '49.51429653451733',
    longitude: '10.87531216443598',
    timestamp: '1401729237.592610',
    trigger: 'enter'
 }
}
 */
/** ******************************************************************************
 * takes an event triggered by Geofancy and creates und certain circumstances a new Time Entry
 *
 * curl -X POST -H "Content-Type: application/json" -d '{"device": "0C799CAD-D148-4F05-94EA-A74086AA91E3", "id": "Work", "latitude": "49.51429653451733", "longitude": "10.87531216443598", "timestamp": "1401728167.886038", "trigger": "enter"}' http://localhost:30000/api/geofence
 * curl -X POST -H "Content-Type: application/json" -d '{"device": "0C799CAD-D148-4F05-94EA-A74086AA91E3", "id": "Home", "latitude": "49.51429653451733", "longitude": "10.87531216443598", "timestamp": "1401728167.886038", "trigger": "enter"}' http://localhost:30000/api/geofence
 *
 ****************************************************************************** */
exports.geofence = (req, res) => {
  console.log(JSON.stringify(req.body));

  const direction = (req.body.trigger == 'enter' ? 'enter' : 'go');
  if (req.body.id === 'Work') {
    const timeEntry = {
      direction,
      longitude: req.body.longitude,
      latitude: req.body.latitude,
    };

    util.create(timeEntry)
      .then(timeentry => res.status(200).send(timeentry))
      .catch(err => res.status(500).send(`Error while createing a new Time Entry: ${err.message}`));
  } else {
    res.status(500).send({
      message: "no geofence entry made; id must be 'Work' but is '" + req.body.id + "')",
    });
  }
};
