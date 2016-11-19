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
		return moment().format('YYYY-MM-DD HH:mm:ss SSS');
	});
	app.use(express.logger('[:mydate]:method :url :status :res[content-length] - :remote-addr - :response-time ms'));     
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
app.post('/entries', routes.createEntry);
app.get('/entries/:id', routes.getEntryById);
app.put('/entries/:id', routes.storeEntryById);
app.delete('/entries/:id', routes.delete);
app.get('/entries', routes.getEntries);

// geofencing
app.post('/geofence', routes.geofence);

// admin stuff
app.delete ('/entries', admin.deleteAllTimeEntries);
app.put('/admin/rnd_entries', admin.setRandomTimeEntries);
app.get('/admin/maintain', admin.maintain);
app.post('/admin/dump/timeentry', admin.dumpTimeEntry);
app.post('/admin/backup/timeentry', admin.backupTimeEntry);

// statistics stuff
app.put('/stats', admin.calcStats);
app.get('/stats/:date', admin.getStatsDay);
app.delete('/stats', admin.deleteAllStatsDays);

// maintain stuff
app.get('/ping', admin.ping);
app.get('/test', admin.test);

// start the web service
console.log('\nusage: node --dbenv=[local|openshift] server.js\n');
http.createServer(app).listen(app.get('port'), app.get('host'), function() {
	console.log("Express server listening on http://" + app.get('host') + ':' + app.get('port'));
});

// start the scheduler
console.log("job scheduler: calcStats");
//schedule.scheduleJob({minute: 0}, function() {
schedule.scheduleJob('0 * * * *', function() {  // every hour at ??:00
	console.log('scheduled task "calcStats" started')
    admin.calcStats;
});
console.log("job scheduler: dumpTimeEntry");
//schedule.scheduleJob({hour: 4, minute: 0}, function() {
schedule.scheduleJob('5 4 * * *', function() {  // every day at 04:05
	console.log('scheduled task "dumpTimeEntry" started')
    admin.dumpTimeEntry;
});
console.log("job scheduler: backupTimeEntry");
//schedule.scheduleJob({hour: 4, minute: 0}, function() {
//schedule.scheduleJob('10 4 * * *', function() {  // every day at 04:10
schedule.scheduleJob('* * * * *', function() {  // every day at 04:10
	console.log('scheduled task "bacupTimeEntry" started')
    admin.backupTimeEntry;
});
console.log("job scheduler: test");
schedule.scheduleJob('* * * * *', function() {
    console.log('schedule: ' + new Date());
}); 


/*
# .---------------- minute (0 - 59)
# |  .------------- hour (0 - 23)
# |  |  .---------- day of month (1 - 31)
# |  |  |  .------- month (1 - 12) OR jan,feb,mar,apr ...
# |  |  |  |  .---- day of week (0 - 6) (Sunday=0 or 7) OR sun,mon,tue,wed,thu,fri,sat
# |  |  |  |  |
# *  *  *  *  * user-name  command to be executed
schedule.scheduleJob('0 17 ? * 0,4-6', function(){
*/