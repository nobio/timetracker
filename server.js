/**
 * Module dependencies.
 */

// mongoose setup
require('./db');

var express = require('express');
var routes = require('./routes'); // -> reades ./routes/index.js
var http = require('http');
var path = require('path');

var app = express();

app.configure(function() {
    app.set('host', process.env.OPENSHIFT_NODEJS_IP   || '0.0.0.0');
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


app.configure('development', function () {
    app.use(express.errorHandler({ dumpExceptions : true, showStack : true }));
});

app.configure('production', function () {
    app.use(express.errorHandler());
});

// routes
app.get('/', routes.index);
app.get('/admin', routes.admin);
app.get('/advanced', routes.advanced);
app.get('/stats', routes.stats);

// restful services
app.post('/entry', routes.entry);
app.get('/entry/:id', routes.getEntryById);
app.put('/entry/:id', routes.storeEntryById);
app.delete('/entry', routes.deleteAll);
app.delete('/entry/:id', routes.delete);
app.get('/entry/dt/:date', routes.getAllByDate)

// start the web service
console.log('\nusage: node --dbenv=[local|mongodb] server.js\n');
http.createServer(app).listen(app.get('port'), app.get('host'), function() {
    console.log("Express server listening on http://" + app.get('host') + ':' + app.get('port'));
});
