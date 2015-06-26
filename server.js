/**
 * Module dependencies.
 */

// mongoose setup
require('./db');

var express = require('express');
var routes = require('./routes');
// -> reades ./routes/index.js
var admin = require('./routes/admin');
var http = require('http');
var path = require('path');
var schedule = require('node-schedule');
var moment = require('moment');

var app = express();

app.configure(function() {
	app.set('host', process.env.IP   || process.env.OPENSHIFT_NODEJS_IP   || '0.0.0.0');
	app.set('port', process.env.PORT || process.env.OPENSHIFT_NODEJS_PORT || '30000');
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.favicon());
    app.use(express.logger('dev'));
    express.logger.format('mydate', function() {
        return moment().format('DD.MM.YYYY HH:mm:ss SSS');
    });
    app.use(express.logger('[:mydate] :method :url :status :res[content-length] - :remote-addr - :response-time ms'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(app.router);
	app.use(express.cookieParser());
	app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function() {
	app.use(express.errorHandler({
		dumpExceptions : true,
		showStack : true
	}));
});

app.configure('production', function() {
	app.use(express.errorHandler());
});

// routes to jade templates
app.get('/', routes.index);
app.get('/admin', routes.admin);
app.get('/admin_item', routes.admin_item);
app.get('/stats', routes.stats);
app.get('/geo', routes.geoloc);

// restful services
app.post('/entry', routes.createEntry);
app.get('/entry/:id', routes.getEntryById);
app.put('/entry/:id', routes.storeEntryById);
app.delete('/entry/:id', routes.delete);
app.get('/entry', routes.getEntries);
app.get('/entries/dt/:date', routes.getAllByDate);
app.get('/entries/busy/:date', routes.getBusyTime);

// geofencing
app.post('/geofence', routes.geofence);

// admin stuff
app.delete ('/entries', admin.deleteAllTimeEntries);
app.put('/admin/rnd_entries', admin.setRandomTimeEntries);
app.get('/admin/maintain', admin.maintain);
app.post('/admin/dump/timeentry', admin.dumpTimeEntry);

// statistics stuff
app.put('/stats', admin.calcStats);
app.get('/stats/:date', admin.getStatsDay);
app.delete('/stats', admin.deleteAllStatsDays);

// start the web service
console.log('\nusage: node --dbenv=[local|openshift] server.js\n');
http.createServer(app).listen(app.get('port'), app.get('host'), function() {
	console.log("Express server listening on http://" + app.get('host') + ':' + app.get('port'));
});

// start the scheduler
schedule.scheduleJob({minute: 0}, function(){
    admin.calcStats();
});
schedule.scheduleJob({hour: 4, minute: 0}, function(){
    admin.dumpTimeEntry();
});



