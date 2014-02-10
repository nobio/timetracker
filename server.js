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

var app = express();

app.configure(function() {
	app.set('host', process.env.OPENSHIFT_NODEJS_IP || '0.0.0.0');
	app.set('port', process.env.OPENSHIFT_NODEJS_PORT || '30000');
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.favicon());
	app.use(express.logger('dev'));
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

// routes
app.get('/', routes.index);
app.get('/admin', routes.admin);
app.get('/advanced', routes.advanced);
app.get('/stats', routes.stats);
app.get('/geo', routes.geoloc);

// restful services
app.post('/entry', routes.entry);
app.get('/entry/:id', routes.getEntryById);
app.put('/entry/:id', routes.storeEntryById);
app.delete('/entry/:id', routes.delete);
app.get('/entries/dt/:date', routes.getAllByDate)
app.get('/entries/busy/:date', routes.getBusyTime)

// admin stuff
app.delete ('/entries', admin.deleteAllTimeEntries);
app.put('/admin/rnd_entries', admin.setRandomTimeEntries)
app.put('/admin/holiday', admin.setHoliday)
app.put('/admin/holidays', admin.setHolidays)
app.get('/admin/maintain', admin.maintain)
app.post('/admin/dump/timeentry', admin.dumpTimeEntry)

// statistics stuff
app.put('/stats', admin.calcStats)
app.get('/stats/:date', admin.getStatsDay)
app.delete ('/stats', admin.deleteAllStatsDays)

// start the web service
console.log('\nusage: node --dbenv=[local|mongodb] server.js\n');
http.createServer(app).listen(app.get('port'), app.get('host'), function() {
	console.log("Express server listening on http://" + app.get('host') + ':' + app.get('port'));
});
