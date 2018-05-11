/**
 * Module dependencies.
 */

// mongoose setup
require('./db/db');

const express = require('express');
const routes = require('./routes'); // -> reades ./routes/index.js
const apiEntries = require('./routes/entries');
const apiAdmin = require('./routes/admin');
const apiStats = require('./routes/stats');
const experimental = require('./routes/experimental');
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
app.set('view engine', 'jade');
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
// routes to jade templates
app.get('/', routes.index);
app.get('/admin', routes.admin);
app.get('/admin_item', routes.admin_item);
app.get('/stats', routes.stats);
app.get('/statistics', routes.statistics);
app.get('/geo', routes.geoloc);

// restful services for entries using Promises
app.post('/api/entries', apiEntries.createEntry);
app.get('/api/entries/:id', apiEntries.getEntryById);
app.put('/api/entries/:id', apiEntries.saveEntry);
app.delete('/api/entries/:id', apiEntries.deleteEntry);
app.get('/api/entries', apiEntries.getEntries);


// geofencing
app.post('/api/geofence', apiEntries.geofence);
app.post('/geofence', apiEntries.geofence);

// admin stuff
app.post('/api/entries/dump', apiAdmin.dumpTimeEntries);
app.post('/api/entries/backup', apiAdmin.backupTimeEntries);

// statistics stuff
app.put('/api/stats', apiStats.calcStats); // done
app.get('/api/stats/:date', apiStats.getStats); // done
app.delete('/api/stats', apiStats.deleteAllStatsDays); // done
app.get('/api/statistics/aggregate', apiStats.getStatsByTimeBox); // done

// maintain stuff
app.get('/ping', experimental.ping); // todo
app.get('/experiment', experimental.experiment);
// app.delete('/experiment/entries', experimental.deleteAllTimeEntries);
// app.put('/experiment/rnd_entries', experimental.setRandomTimeEntries);

// start the web service
http.createServer(app).listen(app.get('port'), app.get('host'), () => {
  console.log(`\nExpress server listening on http://${app.get('host')}:${app.get('port')}`);
});


/* start scheduler */
require('./routes/scheduler').scheduleTasks();
