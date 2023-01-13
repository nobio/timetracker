const { SpanStatusCode } = require('@opentelemetry/api');
const util = require('./util-entries');
const { Tracer } = require('../tracing/Tracer');

/** ******************************************************************************
 * Get one Time Entry by it's id
 *
 * curl -X GET http://localhost:30000/api/entries/5a2100cf87f1f368d087696a
 ****************************************************************************** */
exports.getEntryById = async (req, res) => {
  const span = Tracer.startSpan('auth.getAllUsers');
  if (span.isRecording()) { span.setAttribute('entryId', req.params.id); }

  try {
    const timeEntry = await util.findById(req.params.id);
    span.setStatus({ code: SpanStatusCode.OK });
    res.status(200).send(timeEntry);
  } catch (error) {
    span.recordException(error);
    res.status(500).send(error.message);
  } finally {
    span.end();
  }
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

  const span = Tracer.getTracer().startSpan('entry.getEntries');

  if (span.isRecording()) {
    span.setAttribute('filterByDate', filterByDate);
    span.setAttribute('filterByBusy', filterByBusy);
  }

  try {
    if (filterByDate && filterByBusy) {
      // console.log('filter by date and busy');
      res.status(500).send('date and busy filter set; can only handle one of them');
    } else if (filterByDate) {
      // console.log(`filter by date: ${filterByDate}`);
      util.getAllByDate(filterByDate)
        .then((timeentries) => res.status(200).send(timeentries))
        .catch((err) => res.status(500).send(err));
    } else if (filterByBusy) {
      // console.log(`filter by busy: ${filterByBusy}`);
      util.getAllByDate(filterByBusy)
        .then(util.calculateBusyTime)
        .then((busytime) => res.status(200).send(busytime))
        .catch((err) => res.status(500).send(err.message));
    } else {
      util.getAll()
        .then((timeentry) => res.status(200).send(timeentry))
        .catch((err) => res.status(500).send(`Error while reading Time Entry: ${req.params.id} ${err.message}`));
    }
  } catch (error) {
    span.recordException(error);
    span.setStatus({ code: 500, message: String(error) });
  } finally {
    span.end();
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
exports.createEntry = async (req, res) => {
  // console.log(JSON.stringify(req.body));
  const timeEntry = {
    direction: req.body.direction,
    datetime: req.body.datetime,
    longitude: req.body.longitude,
    latitude: req.body.latitude,
  };

  /* creating OTEL Span */
  const span = Tracer.startSpan('entry.createEntry');
  if (span.isRecording()) { span.setAttribute('timeEntry', timeEntry); }

  try {
    const createdTimeentry = await util.create(timeEntry);
    span.setStatus({ code: SpanStatusCode.OK });
    res.status(200).send(createdTimeentry);
  } catch (error) {
    span.recordException(error);
    res.status(500).send(`Error while creating a new Time Entry: ${error.message}`);
  } finally { span.end(); }
};

/** ******************************************************************************
 * stores one Time Entry
 *
 * curl -X PUT -H "Content-Type: application/json" -d '{"direction":"enter", "latitude":"45", "longitude":"45"}' http://localhost:30000/api/entries/5a36aab25ba9cf154bd2a384
 ****************************************************************************** */
exports.saveEntry = async (req, res) => {
  // console.log(JSON.stringify(req.body))
  const { id } = req.params;
  const timeEntry = {
    id: req.params.id,
    direction: req.body.direction,
    entry_date: req.body.entry_date,
    datetime: req.body.datetime,
    longitude: req.body.longitude,
    latitude: req.body.latitude,
  };

  /* creating OTEL Span */
  const span = Tracer.startSpan('entry.createEntry');
  if (span.isRecording()) { span.setAttribute('timeEntry', timeEntry); }

  try {
    const savedTimeentry = await util.update(timeEntry);
    span.setStatus({ code: SpanStatusCode.OK });
    res.status(200).send(savedTimeentry);
  } catch (error) {
    span.recordException(error);
    res.status(500).send(`Error while saving Time Entry: ${id} ${error.message}`);
  } finally { span.end(); }
};

/** ******************************************************************************
 * deletes one time entry by it's id
 *
 * curl -X DELETE http://localhost:30000/api/entries/5a24076af89b40156b1c0efe
 ****************************************************************************** */
exports.deleteEntry = async (req, res) => {
  const { id } = req.params;

  const span = Tracer.startSpan('entry.deleteEntry');
  if (span.isRecording()) { span.setAttribute('entryId', id); }

  try {
    const timeEntry = await util.deleteById(id);
    if (timeEntry === undefined || timeEntry === null) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: `Could not delete Time Entry with (id: ${id})` });
      res.status(404).send(`Could not delete Time Entry with (id: ${id})`);
    } else {
      span.setStatus({ code: SpanStatusCode.OK });
      res.status(200).send(timeEntry);
    }
  } catch (error) {
    span.recordException(error);
    res.status(500).send(`Error while reading Time Entry: ${req.params.id} - ${error.message}`);
  } finally {
    span.end();
  }
};

/**
 * curl -X POST http://localhost:30000/api/entries/error/evaluate
 */
exports.evaluate = async (req, res) => {
  const span = Tracer.startSpan('entry.evaluate');
  try {
    const reply = await util.evaluate();
    span.setStatus({ code: SpanStatusCode.OK });
    res.status(200).send(reply);
  } catch (error) {
    span.recordException(error);
    res.status(500).send(`Error while validating Time Entries: ${error}`);
  } finally { span.end(); }
};

/**
 * curl -X GET http://localhost:30000/api/entries/error/dates
 */
exports.getErrorDates = async (req, res) => {
  const span = Tracer.startSpan('entry.getErrorDates');

  try {
    const reply = await util.getErrorDates();
    res.status(200).send(reply);
  } catch (error) {
    span.recordException(error);
    res.status(500).send(`Error while reading failure dates: ${error}`);
  } finally { span.end(); }
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
 * mind that this endpoint is not secured by OAuth2. It requires Basic Auth
 *
 * curl -X POST -H "Content-Type: application/json" -d '{"device": "0C799CAD-D148-4F05-94EA-A74086AA91E3", "id": "Work", "latitude": "49.51429653451733", "longitude": "10.87531216443598", "timestamp": "1401728167.886038", "trigger": "enter"}' http://localhost:30000/api/geofence
 * curl -X POST -H "Content-Type: application/json" -d '{"device": "0C799CAD-D148-4F05-94EA-A74086AA91E3", "id": "Home", "latitude": "49.51429653451733", "longitude": "10.87531216443598", "timestamp": "1401728167.886038", "trigger": "enter"}' http://localhost:30000/api/geofence
 *
 *
 curl -X 'POST' \
  'https://localhost:30443/api/geofence' \
  -H 'accept: application/json' \
  -H 'Authorization: Basic bm9iaW86c2NoZXJub28=' \
  -H 'Content-Type: application/json' \
  -d '{
  "id": "Work, Home",
  "direction": "enter",
  "longitude": 10.875482,
  "latitude": 49.514135
}'
 ****************************************************************************** */
exports.geofence = async (req, res) => {
  // console.log(JSON.stringify(req.body));
  const span = Tracer.startSpan('entry.geofence');

  let errMsg = '';
  if (!req.body) errMsg += 'body is empty; ';
  if (!req.body.trigger) errMsg += 'trigger is missing; ';
  if (!req.body.id) errMsg += 'id is missing; ';
  if (!req.body.longitude) errMsg += 'longitude is missing; ';
  if (!req.body.latitude) errMsg += 'latitude is missing; ';

  if (errMsg !== '') {
    // console.error(`invalid request: ${errMsg}`);
    span.setStatus({ code: 500, message: `invalid request: ${errMsg}` });
    res.status(500).send({ message: `invalid request: ${errMsg}` });
    return;
  }

  const direction = (req.body.trigger === 'enter' ? 'enter' : 'go');
  if (req.body.id === 'Work') {
    const timeEntry = {
      direction,
      longitude: req.body.longitude,
      latitude: req.body.latitude,
    };

    try {
      const te = await util.create(timeEntry);
      res.status(200).send(te);
    } catch (error) {
      span.recordException(error);
      res.status(500).send(`Error while createing a new Time Entry: ${err.message}`);
    }
  } else {
    span.setStatus({ code: 500, message: `no geofence entry made; id must be 'Work' but is '${req.body.id}')` });
    res.status(500).send({
      message: `no geofence entry made; id must be 'Work' but is '${req.body.id}')`,
    });
  }
};
