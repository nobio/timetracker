/**
 * Module dependencies.
 */
require('dotenv').config();
require('./db');
const rateLimit = require('express-rate-limit');
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5
});

const express = require('express');
const api_entries = require('./api/entries');
const api_admin = require('./api/admin');
const api_stats = require('./api/stats');
const api_misc = require('./api/misc');
const api_auth = require('./api/auth');
const api_geotrack = require('./api/geotrack');

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

require('log-timestamp')(() => `[${moment().format('ddd, D MMM YYYY hh:mm:ss Z')}] - %s`);

const app = express();

app.set('host', process.env.IP || '0.0.0.0');
app.set('port', process.env.PORT || '30000');
app.set('ssl-port', process.env.SSL_PORT || '30443');
app.set('websock-port', process.env.WEBSOCK_PORT || '30444');
//app.use(express.static(path.join(__dirname, 'public')));
//app.use(express.static(path.join(__dirname, 'www')));
//app.use(serveStatic('www', { 'index': ['index.html'] }));
app.use(morgan('[:date[web]] (:remote-addr, :response-time ms) :method :url - status: :status'));
// app.use(morgan(':remote-addr - :remote-user [:date[clf]] ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"'));
app.use(express.json());
app.use(cookieParser());
// apply rate limiter to all requests
app.use(limiter);

app.use(cors());
app.use(api_auth.authorize);

/* ============================================================================= */
const spec = fs.readFileSync(path.join(__dirname, 'spec/swagger.yaml'), 'utf8');
const swaggerDoc = jsyaml.safeLoad(spec);

/*
app.use((req, res, next) => {
   console.log(`▶ headers: ${JSON.stringify(req.headers)}`);
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
// -------------- SWAGGER ------------------------------------------------
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDoc));
// -----------------------------------------------------------------------

// ------------------ API ------------------------------------------------
// restful services for entries using Promises
// -----------------------------------------------------------------------
app.get('/api/entries', api_entries.getEntries);
app.post('/api/entries', api_entries.createEntry);
app.get('/api/entries/:id', api_entries.getEntryById);
app.put('/api/entries/:id', api_entries.saveEntry);
app.delete('/api/entries/:id', api_entries.deleteEntry);
app.post('/api/entries/error/evaluate', api_entries.evaluate);
app.get('/api/entries/error/dates', api_entries.getErrorDates);

// .......................................................................
// geofencing
// .......................................................................
app.post('/api/geofence', api_entries.geofence);
app.post('/api/geotrack', api_geotrack.createGeoTrack);
app.get('/api/geotrack', api_geotrack.getGeoTracking);
app.get('/api/geotrack/metadata', api_geotrack.getGeoTrackingMetadata);

// .......................................................................
// admin
// .......................................................................
app.post('/api/entries/dump', api_admin.dumpModels);
app.post('/api/entries/backup', api_admin.backupTimeEntries);
app.post('/api/entries/restore', api_admin.restoreFromFile);
// .......................................................................
// toggles
// .......................................................................
app.get('/api/toggles', api_admin.getAllToggles);
app.get('/api/toggles/status', api_admin.getToggleStatus);
app.get('/api/toggles/:id', api_admin.getToggleById);
app.get('/api/toggles/name/:name', api_admin.getToggleByName);
app.put('/api/toggles/:id', api_admin.saveToggle);
app.post('/api/toggles', api_admin.createToggle);
app.delete('/api/toggles/:id', api_admin.deleteToggle);

// .......................................................................
// properties
// .......................................................................
app.get('/api/properties', api_admin.getProperties);
app.get('/api/properties/:key', api_admin.getProperty);
app.put('/api/properties/:key', api_admin.setProperty);
app.delete('/api/properties/:key', api_admin.deleteProperty);

// .......................................................................
// statistics
// .......................................................................
app.put('/api/stats', api_stats.calcStats);
app.get('/api/stats/:date/:timeUnit', api_stats.getStats);
app.delete('/api/stats', api_stats.deleteAllStatsDays);
app.get('/api/statistics/aggregate', api_stats.getStatsByTimeBox);
app.get('/api/statistics/histogram/:interval', api_stats.histogram);
app.get('/api/statistics/breaktime/:interval', api_stats.breaktime);

// .......................................................................
// maintain
// .......................................................................
app.get('/api/ping', api_misc.ping);
app.get('/api/version', api_misc.version);
app.get('/api/experiment', api_misc.experiment);
// app.delete('/experiment/entries', experimental.deleteAllTimeEntries);
// app.put('/experiment/rnd_entries', experimental.setRandomTimeEntries);

// .......................................................................
// users and authentication
// .......................................................................
app.get('/api/users', api_auth.getAllUsers);
app.get('/api/users/:id', api_auth.getUser);
app.post('/api/users', api_auth.createUser);
app.put('/api/users/:id', api_auth.updateUser);
app.put('/api/users/:id/password', api_auth.updateUsersPassword);
app.delete('/api/users/:id', api_auth.deleteUser);

app.post('/api/auth/login', api_auth.login);
app.post('/api/auth/logout', api_auth.logout);
app.post('/api/auth/token', api_auth.refreshToken);

if (process.env.SLACK_URL) {
  console.log('using Slack to notify');
} else {
  console.log('ignoring Slack; notification disabled; please provide process.env.SLACK_URL');
}

// .......................................................................
// Optional fallthrough error handler
// .......................................................................
app.use(function onError(err, req, res, next) {
  // The error id is attached to `res.sentry` to be returned
  // and optionally displayed to the user for support.
  res.statusCode = 500;
  res.end(res + "\n");
  //res.end(res.sentry + "\n");
});
/* ================= start the web service on http ================= */
http.createServer(app).listen(app.get('port'), app.get('host'), () => {
  console.log(`\nserver listening on http://${app.get('host')}:${app.get('port')}`);
});

/* ================= start the web service on https ================= */
const ssl_options = {
  key: fs.readFileSync('keys/key.pem'),
  cert: fs.readFileSync('keys/cert.pem'),
};
const httpsServer = https.createServer(ssl_options, app).listen(app.get('ssl-port'), app.get('host'), () => {
  console.log(`\nssl server listening on https://${app.get('host')}:${app.get('ssl-port')}`);
});

/* init and start Websocket Server */
const webSocketFacade = require('./api/ws');
webSocketFacade.init(httpsServer)

/* start scheduler */
require('./api/scheduler').scheduleTasks();

/* send message that server has been started */
require('./api/global_util').sendMessage('SERVER_STARTED', ` on http://${app.get('host')}:${app.get('port')} (${process.env.NODE}, ${process.env.USER}, ${process.env.LANG})`)
  .then(msg => console.log(msg))
  .catch(err => console.log(err));
