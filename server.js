/* eslint-disable no-cond-assign */
/* eslint-disable no-constant-condition */

/**
 * Module dependencies.
 */
const logger = require('./api/config/logger'); // Logger configuration
console.log(require('figlet').textSync('Timetracker'));
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const express = require('express');
const http = require('http');
const https = require('https');
const path = require('path');
const moment = require('moment');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const swaggerUi = require('swagger-ui-express');
const jsyaml = require('js-yaml');
const cors = require('cors');
const db = require('./db');
const globalUtil = require('./api/global_util');
const apiGeotrack = require('./api/geotrack');
const apiAuth = require('./api/auth');
const apiMisc = require('./api/misc');
const apiStats = require('./api/stats');
const apiAdmin = require('./api/admin');
const apiEntries = require('./api/entries');
const apiSchedule = require('./api/schedule');
const scheduler = require('./api/schedule/scheduler');

require('log-timestamp')(() => `[${moment().format('ddd, DD MMM YYYY hh:mm:ss Z')}] - %s`);

const app = express();

// morgan.token('req-headers', (req, res) => JSON.stringify(req.headers));

app.set('host', process.env.IP || '0.0.0.0');
app.set('port', process.env.PORT || '30000');
app.set('ssl-port', process.env.SSL_PORT || '30443');
app.set('websock-port', process.env.WEBSOCK_PORT || '30444');
app.use(morgan('[:date[web]] (:remote-addr, :response-time ms) :method :url (:user-agent) status: :status'));
app.use(express.json());
app.use(cookieParser());

// apply rate limiter to all requests
if (process.env.RATE_LIMIT_ACTIVE === 'true') {
  app.use(rateLimit({
    windowMs: process.env.RATE_LIMIT_WINDOW_MS || 1000, // Default: pro Sekunde
    max: process.env.RATE_LIMIT_REQUESTS || 100, // limit each IP to 100 requests per windowMs
  }));
}

app.use(cors());
app.use(apiAuth.authorize);

/* ============================================================================= */
const spec = fs.readFileSync(path.join(__dirname, 'spec/openapi.yaml'), 'utf8');
const swaggerDoc = jsyaml.load(spec);

/*
  app.use((req, res, next) => {
    logger.info(`▶ headers: ${JSON.stringify(req.headers, null, 2)}`);
    logger.info(`▶ params:${JSON.stringify(req.params)}`);
    logger.info(`▶ body:${JSON.stringify(req.body)}`);
    next();
  });
  */
/*
  app.configure('production', function() {
    app.use(express.errorHandler());
  });
  */
app.use(compression({
  filter(req, res) {
    if (req.headers['x-no-compression']) {
      // don't compress responses with this request header
      return false;
    }
    // fallback to standard filter function
    return compression.filter(req, res);
  },
}));
// -------------- SWAGGER ------------------------------------------------
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
// -----------------------------------------------------------------------

// ------------------ API ------------------------------------------------
// restful services for entries using Promises
// -----------------------------------------------------------------------
const API_PATH = process.env.API_PATH || '/api';

app.get(`${API_PATH}/entries`, apiEntries.getEntries);
app.post(`${API_PATH}/entries`, apiEntries.createEntry); // token authorization
app.put(`${API_PATH}/entries`, apiEntries.createEntry); // basic authorization
app.get(`${API_PATH}/entries/:id`, apiEntries.getEntryById);
app.put(`${API_PATH}/entries/:id`, apiEntries.saveEntry);
app.delete(`${API_PATH}/entries/:id`, apiEntries.deleteEntry);
app.post(`${API_PATH}/entries/error/evaluate`, apiEntries.evaluate);
app.get(`${API_PATH}/entries/error/dates`, apiEntries.getErrorDates);
app.post(`${API_PATH}/entries/mark`, apiEntries.markADay);
// .......................................................................
// geofencing
// .......................................................................
// app.post('/api/geofence', apiEntries.geofence);
app.post(`${API_PATH}/geotrack`, apiGeotrack.createGeoTrack);
app.get(`${API_PATH}/geotrack`, apiGeotrack.getGeoTracking);
app.get(`${API_PATH}/geotrack/metadata`, apiGeotrack.getGeoTrackingMetadata);

app.get(`${API_PATH}/geofences`, apiAdmin.getGeofences);
app.get(`${API_PATH}/geofences/:id`, apiAdmin.getGeofence);
app.post(`${API_PATH}/geofences`, apiAdmin.createGeofence);
app.put(`${API_PATH}/geofences/:id`, apiAdmin.saveGeofence);
app.delete(`${API_PATH}/geofences/:id`, apiAdmin.deleteGeofence);

// .......................................................................
// admin
// .......................................................................
app.post(`${API_PATH}/entries/dump`, apiAdmin.dumpModels);
app.get(`${API_PATH}/entries/dump/:modelType`, apiAdmin.getDumpedModels);
app.post(`${API_PATH}/entries/backup`, apiAdmin.backupTimeEntries);
app.post(`${API_PATH}/entries/restore`, apiAdmin.restore);

// .......................................................................
// toggles
// .......................................................................
app.get(`${API_PATH}/toggles`, apiAdmin.getAllToggles);
app.get(`${API_PATH}/toggles/status`, apiAdmin.getToggleStatus);
app.get(`${API_PATH}/toggles/:id`, apiAdmin.getToggleById);
app.get(`${API_PATH}/toggles/name/:name`, apiAdmin.getToggleByName);
app.put(`${API_PATH}/toggles/:id`, apiAdmin.saveToggle);
app.post(`${API_PATH}/toggles`, apiAdmin.createToggle);
app.delete(`${API_PATH}/toggles/:id`, apiAdmin.deleteToggle);

// .......................................................................
// properties
// .......................................................................
app.get(`${API_PATH}/properties`, apiAdmin.getProperties);
app.get(`${API_PATH}/properties/:key`, apiAdmin.getProperty);
app.put(`${API_PATH}/properties/:key`, apiAdmin.setProperty);
app.delete(`${API_PATH}/properties/:key`, apiAdmin.deleteProperty);

// .......................................................................
// statistics
// .......................................................................
app.put(`${API_PATH}/stats`, apiStats.calcStats);
app.get(`${API_PATH}/stats/:date/:timeUnit`, apiStats.getStats);
app.delete(`${API_PATH}/stats`, apiStats.deleteAllStatsDays);
app.get(`${API_PATH}/statistics/aggregate`, apiStats.getStatsByTimeBox);
app.get(`${API_PATH}/statistics/histogram/:interval`, apiStats.histogram);
app.get(`${API_PATH}/statistics/breaktime/:interval`, apiStats.breaktime);
app.get(`${API_PATH}/statistics/extrahours`, apiStats.extraHours);

// .......................................................................
// maintain
// .......................................................................
app.get(`${API_PATH}/ping`, apiMisc.ping);
app.get(`${API_PATH}/version`, apiMisc.version);
app.all(`${API_PATH}/experiment`, apiMisc.experiment);
app.get(`${API_PATH}/health`, apiMisc.healthcheck);
// log the request on different methods
app.get(`${API_PATH}/log`, apiMisc.log);
app.post(`${API_PATH}/log`, apiMisc.log);
app.put(`${API_PATH}/log`, apiMisc.log);

// .......................................................................
// users and authentication
// .......................................................................
app.get(`${API_PATH}/users`, apiAuth.getAllUsers);
app.get(`${API_PATH}/users/:id`, apiAuth.getUser);
app.post(`${API_PATH}/users`, apiAuth.createUser);
app.put(`${API_PATH}/users/:id`, apiAuth.updateUser);
app.put(`${API_PATH}/users/:id/password`, apiAuth.updateUsersPassword);
app.delete(`${API_PATH}/users/:id`, apiAuth.deleteUser);

app.post(`${API_PATH}/auth/login`, apiAuth.login);
app.post(`${API_PATH}/auth/logout`, apiAuth.logout);
app.post(`${API_PATH}/auth/token`, apiAuth.refreshToken);

// .......................................................................
// export functionalities that are supposed to run regulary. If
// timetracker does not do scheduling (see process.env.START_CRONJOBS)
// the jobs should be triggered from outside (for example by a CronJob pod)
// .......................................................................
app.put(`${API_PATH}/schedule`, apiSchedule.schedule);
// .......................................................................
// Check Slack url
// .......................................................................
if (process.env.SLACK_URL) {
  logger.info('using Slack to notify');
} else {
  logger.info('ignoring Slack; notification disabled; please provide process.env.SLACK_URL');
}
// .......................................................................
// Check MinIO
// .......................................................................
if (process.env.MINIO_ACTIVE === 'true') {
  logger.info('using MinIO to save and read database objects');
} else {
  logger.info('MinIO is not used. If you want to use MinIO please set process.env.MINIO_ACTIVE to true');
}

// .......................................................................
// Optional fallthrough error handler
// .......................................................................
app.use((err, req, res, next) => {
  // The error id is attached to `res.sentry` to be returned
  // and optionally displayed to the user for support.
  res.statusCode = 500;
  res.end(`${res}\n`);
  // res.end(res.sentry + "\n");
});
/* ================= start the web service on http ================= */
const httpServer = http.createServer(app).listen(app.get('port'), app.get('host'), () => {
  logger.info(`server listening on http://${app.get('host')}:${app.get('port')}`);
});

/* ================= start the web service on https ================= */
const sslOptions = {
  key: Buffer.from(process.env.SSL_PRIVATE_KEY_BASE64, 'base64').toString('ascii'),
  cert: Buffer.from(process.env.SSL_CERT_BASE64, 'base64').toString('ascii'),
};

// write output to console
const httpsServer = https.createServer(sslOptions, app).listen(app.get('ssl-port'), app.get('host'), () => {
  logger.info(`ssl server listening on https://${app.get('host')}:${app.get('ssl-port')}`);
});

/* init and start Websocket Server */
const webSocketFacade = require('./api/ws');

webSocketFacade.init(httpsServer);

/* start scheduler */
if (process.env.START_CRONJOBS !== 'false') { // default should be "start it up". I need to explicitly switch startup off
  scheduler.scheduleTasks();
}

/* send message that server has been started */
globalUtil.sendMessage('SERVER_STARTED', `on http://${app.get('host')}:${app.get('port')}`);

/* shutdown */
const gracefulShutdown = async () => {
  logger.info('Closing server and ending process...');
  await globalUtil.sendMessage('SERVER_SHUTDOWN');

  webSocketFacade.shutdown();
  logger.info('websocket closed');

  await httpServer.close();
  logger.info('http server stopped');

  await httpsServer.close();
  logger.info('https server stopped');

  await db.closeConnection();
  logger.info('database disconnected');

  process.exit();
};
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
