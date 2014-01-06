// Here you can find the schema definition of noodle data.
// The top element always is a 'noodle' which represents an appointment

console.log("init database");


var mongoose = require('mongoose');
var schema   = mongoose.Schema;

var directions = 'enter go'.split(' ')
var TimeEntry = new schema({
                           entry_date: {type: Date, default: Date.now},
                           direction: { type: String, enum: directions },
                           last_changed: {type: Date, default: Date.now}
});

mongoose.model('TimeEntry', TimeEntry);

var mongodb_url = dburl();

console.log('connecting to mongodb on ' + mongodb_url);
mongoose.connect(mongodb_url, { server: { poolSize: 2 }});
console.log('connected to mongodb');

// read the database url respcting the environment (local or openshift)
function dburl() {
	var fs = require('fs');
	var db_config = JSON.parse(fs.readFileSync('./db-conf.json','utf8'));

	var dbconfig = (process.env.OPENSHIFT_APP_UUID ? db_config.openshift : db_config.local);
	return 'mongodb://' + dbconfig.user + ':' + dbconfig.password + '@' + dbconfig.uri;
}