/**
 * Module dependencies.
 */

// mongoose setup
require('./db');

var express = require('express');
var routes = require('./routes'); // -> reades ./routes/index.js
var admin = require('./routes/admin');
var experimental = require('./routes/experimental');
var http = require('http');
var path = require('path');
var moment = require('moment');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var app = express();

app.set('host', process.env.IP || process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0');
app.set('port', process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || '30000');
app.set('views', __dirname + '/views');
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'jade');
app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));

if (process.env.NODE_ENV !== 'production' /* or whatever env variable you want to use */) {
    app.use(logger('dev'));
}
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

// restful services
app.post('/entries', routes.createEntry);
app.get('/entries/:id', routes.getEntryById);
app.put('/entries/:id', routes.storeEntryById);
app.delete('/entries/:id', routes.delete);
app.get('/entries', routes.getEntries);

// geofencing
app.post('/geofence', routes.geofence);

// admin stuff
app.delete('/entries', admin.deleteAllTimeEntries);
app.put('/admin/rnd_entries', admin.setRandomTimeEntries);
app.get('/admin/maintain', admin.maintain);
app.post('/admin/dump/timeentry', admin.dumpTimeEntry);
app.post('/admin/backup/timeentry', admin.backupTimeEntry);

// statistics stuff
app.put('/stats', admin.calcStats);
app.get('/stats/:date', admin.getStatsDay);
app.delete('/stats', admin.deleteAllStatsDays);
app.get('/statistics/aggregate', admin.getStatsByTimeBox);

// maintain stuff
app.get('/ping', experimental.ping);
app.get('/experiment', experimental.experiment);

// start the web service
http.createServer(app).listen(app.get('port'), app.get('host'), () => {
	console.log("\nExpress server listening on http://" + app.get('host') + ':' + app.get('port'));
});


/* start scheduler */
require('./routes/scheduler').scheduleTasks();
