/* eslint-disable no-cond-assign */
/* eslint-disable no-constant-condition */
/* eslint-disable no-console */
/**
 * Module dependencies.
 */
require('dotenv').config();

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
const api_geotrack = require('./api/geotrack');
const api_auth = require('./api/auth');
const api_misc = require('./api/misc');
const api_stats = require('./api/stats');
const api_admin = require('./api/admin');
const api_entries = require('./api/entries');
const api_schedule = require('./api/schedule');

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

app.use(rateLimit({
  windowMs: process.env.RATE_LIMIT_WINDOW_MS, // 10 requests per second
  max: process.env.RATE_LIMIT_RQEUESTS,
}));

app.use(cors());
app.use(api_auth.authorize);

/* ============================================================================= */
const spec = fs.readFileSync(path.join(__dirname, 'spec/openapi.yaml'), 'utf8');
const swaggerDoc = jsyaml.load(spec);

/*
app.use((req, res, next) => {
  console.log(`▶ headers: ${JSON.stringify(req.headers, null, 2)}`);
  console.log(`▶ params:${JSON.stringify(req.params)}`);
  console.log(`▶ body:${JSON.stringify(req.body)}`);
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

app.get(`${API_PATH}/entries`, api_entries.getEntries);
app.post(`${API_PATH}/entries`, api_entries.createEntry);
app.get(`${API_PATH}/entries/:id`, api_entries.getEntryById);
app.put(`${API_PATH}/entries/:id`, api_entries.saveEntry);
app.delete(`${API_PATH}/entries/:id`, api_entries.deleteEntry);
app.post(`${API_PATH}/entries/error/evaluate`, api_entries.evaluate);
app.get(`${API_PATH}/entries/error/dates`, api_entries.getErrorDates);
app.post(`${API_PATH}/entries/mark`, api_entries.markADay);
// .......................................................................
// geofencing
// .......................................................................
// app.post('/api/geofence', api_entries.geofence);
app.post(`${API_PATH}/geotrack`, api_geotrack.createGeoTrack);
app.get(`${API_PATH}/geotrack`, api_geotrack.getGeoTracking);
app.get(`${API_PATH}/geotrack/metadata`, api_geotrack.getGeoTrackingMetadata);

app.get(`${API_PATH}/geofences`, api_admin.getGeofences);
app.get(`${API_PATH}/geofences/:id`, api_admin.getGeofence);
app.post(`${API_PATH}/geofences`, api_admin.createGeofence);
app.put(`${API_PATH}/geofences/:id`, api_admin.saveGeofence);
app.delete(`${API_PATH}/geofences/:id`, api_admin.deleteGeofence);

// .......................................................................
// admin
// .......................................................................
app.post(`${API_PATH}/entries/dump`, api_admin.dumpModels);
app.get(`${API_PATH}/entries/dump/:modelType`, api_admin.getDumpedModels);
app.post(`${API_PATH}/entries/backup`, api_admin.backupTimeEntries);
app.post(`${API_PATH}/entries/restore`, api_admin.restore);

// .......................................................................
// toggles
// .......................................................................
app.get(`${API_PATH}/toggles`, api_admin.getAllToggles);
app.get(`${API_PATH}/toggles/status`, api_admin.getToggleStatus);
app.get(`${API_PATH}/toggles/:id`, api_admin.getToggleById);
app.get(`${API_PATH}/toggles/name/:name`, api_admin.getToggleByName);
app.put(`${API_PATH}/toggles/:id`, api_admin.saveToggle);
app.post(`${API_PATH}/toggles`, api_admin.createToggle);
app.delete(`${API_PATH}/toggles/:id`, api_admin.deleteToggle);

// .......................................................................
// properties
// .......................................................................
app.get(`${API_PATH}/properties`, api_admin.getProperties);
app.get(`${API_PATH}/properties/:key`, api_admin.getProperty);
app.put(`${API_PATH}/properties/:key`, api_admin.setProperty);
app.delete(`${API_PATH}/properties/:key`, api_admin.deleteProperty);

// .......................................................................
// statistics
// .......................................................................
app.put(`${API_PATH}/stats`, api_stats.calcStats);
app.get(`${API_PATH}/stats/:date/:timeUnit`, api_stats.getStats);
app.delete(`${API_PATH}/stats`, api_stats.deleteAllStatsDays);
app.get(`${API_PATH}/statistics/aggregate`, api_stats.getStatsByTimeBox);
app.get(`${API_PATH}/statistics/histogram/:interval`, api_stats.histogram);
app.get(`${API_PATH}/statistics/breaktime/:interval`, api_stats.breaktime);
app.get(`${API_PATH}/statistics/extrahours`, api_stats.extraHours);

// .......................................................................
// maintain
// .......................................................................
app.get(`${API_PATH}/ping`, api_misc.ping);
app.get(`${API_PATH}/version`, api_misc.version);
app.all(`${API_PATH}/experiment`, api_misc.experiment);
app.get(`${API_PATH}/health`, api_misc.healthcheck);
// log the request on different methods
app.get(`${API_PATH}/log`, api_misc.log);
app.post(`${API_PATH}/log`, api_misc.log);
app.put(`${API_PATH}/log`, api_misc.log);

// .......................................................................
// users and authentication
// .......................................................................
app.get(`${API_PATH}/users`, api_auth.getAllUsers);
app.get(`${API_PATH}/users/:id`, api_auth.getUser);
app.post(`${API_PATH}/users`, api_auth.createUser);
app.put(`${API_PATH}/users/:id`, api_auth.updateUser);
app.put(`${API_PATH}/users/:id/password`, api_auth.updateUsersPassword);
app.delete(`${API_PATH}/users/:id`, api_auth.deleteUser);

app.post(`${API_PATH}/auth/login`, api_auth.login);
app.post(`${API_PATH}/auth/logout`, api_auth.logout);
app.post(`${API_PATH}/auth/token`, api_auth.refreshToken);

// .......................................................................
// export functionalities that are supposed to run regulary. If
// timetracker does not do scheduling (see process.env.START_CRONJOBS)
// the jobs should be triggered from outside (for example by a CronJob pod)
// .......................................................................
app.put(`${API_PATH}/schedule`, api_schedule.schedule);
// .......................................................................
// Check Slack url
// .......................................................................
if (process.env.SLACK_URL) {
  console.log('using Slack to notify');
} else {
  console.log('ignoring Slack; notification disabled; please provide process.env.SLACK_URL');
}
// .......................................................................
// Check MinIO
// .......................................................................
if (process.env.MINIO_ACTIVE === 'true') {
  console.log('using MinIO to save and read database objects');
} else {
  console.log('MinIO is not used. If you want to use MinIO please set process.env.MINIO_ACTIVE to true');
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
  console.log(`server listening on http://${app.get('host')}:${app.get('port')}`);
});

/* ================= start the web service on https ================= */
const ssl_options = {
  key: Buffer.from(process.env.SSL_PRIVATE_KEY_BASE64, 'base64').toString('ascii'),
  cert: Buffer.from(process.env.SSL_CERT_BASE64, 'base64').toString('ascii'),
};

// write output to console
const httpsServer = https.createServer(ssl_options, app).listen(app.get('ssl-port'), app.get('host'), () => {
  console.log(`ssl server listening on https://${app.get('host')}:${app.get('ssl-port')}`);
});

/* init and start Websocket Server */
const webSocketFacade = require('./api/ws');

webSocketFacade.init(httpsServer);

/* start scheduler */
if (process.env.START_CRONJOBS !== 'false') { // default should be "start it up". I need to explicitly switch startup off
  require('./api/schedule/scheduler').scheduleTasks();
}

/* send message that server has been started */
globalUtil.sendMessage('SERVER_STARTED', `on http://${app.get('host')}:${app.get('port')}`);

/* shutdown */
const gracefulShutdown = async () => {
  console.log('Closing server and ending process...');
  await globalUtil.sendMessage('SERVER_SHUTDOWN');

  webSocketFacade.shutdown();
  console.log('websocket closed');

  await httpServer.close();
  console.log('http server stopped');

  await httpsServer.close();
  console.log('https server stopped');

  await db.closeConnection();
  console.log('database disconnected');

  process.exit();
};
process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
