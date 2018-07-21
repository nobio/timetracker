/**
 * Module dependencies.
 */

// mongoose setup
require('./db');

const express = require('express');
const web = require('./web');
const api_entries = require('./api/entries');
const api_admin = require('./api/admin');
const api_stats = require('./api/stats');
const api_misc = require('./api/misc');
const http = require('http');
const path = require('path');
const moment = require('moment');
const favicon = require('serve-favicon');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
require('log-timestamp')(() => `[${moment().format('ddd, D MMM YYYY hh:mm:ss Z')}] - %s`);

const app = express();

app.set('host', process.env.IP || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0');
app.set('port', process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || '30000');
app.set('views', `${__dirname}/views`);
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'pug');
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(morgan('[:date[web]] :remote-user :method :url - status: :status'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());


/*
app.configure('production', function() {
  app.use(express.errorHandler());
});
*/
// routes to pug templates
app.get('/', web.index);
app.get('/admin', web.admin);
app.get('/admin_item', web.admin_item);
app.get('/stats', web.stats);
app.get('/statistics', web.statistics);
app.get('/geo', web.geoloc); // todo

// restful services for entries using Promises
app.post('/api/entries', api_entries.createEntry);
app.get('/api/entries/:id', api_entries.getEntryById);
app.put('/api/entries/:id', api_entries.saveEntry);
app.delete('/api/entries/:id', api_entries.deleteEntry);
app.get('/api/entries', api_entries.getEntries);


// geofencing
app.post('/api/geofence', api_entries.geofence);

// admin stuff
app.post('/api/entries/dump', api_admin.dumpTimeEntries);
app.post('/api/entries/backup', api_admin.backupTimeEntries);

// statistics stuff
app.put('/api/stats', api_stats.calcStats);
app.get('/api/stats/:date', api_stats.getStats);
app.delete('/api/stats', api_stats.deleteAllStatsDays);
app.get('/api/statistics/aggregate', api_stats.getStatsByTimeBox);
app.get('/api/statistics/histogram/:interval', api_stats.histogram)

// maintain stuff
app.get('/api/ping', api_misc.ping);
app.get('/api/experiment', api_misc.experiment);
// app.delete('/experiment/entries', experimental.deleteAllTimeEntries);
// app.put('/experiment/rnd_entries', experimental.setRandomTimeEntries);

// start the web service
http.createServer(app).listen(app.get('port'), app.get('host'), () => {
  console.log(`\nExpress server listening on http://${app.get('host')}:${app.get('port')}`);
});


/* start scheduler */
require('./api/scheduler').scheduleTasks();
