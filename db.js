// Here you can find the schema definition of noodle data.
// The top element always is a 'noodle' which represents an appointment

console.log("init database");

var fs = require('fs');
var db_config = JSON.parse(fs.readFileSync('./db-conf.json','utf8'));
var mongodb_url = 'mongodb://' + db_config.dbuser  + ':' + db_config.dbpassword + '@' + db_config.uri;

var mongoose = require('mongoose');
var schema   = mongoose.Schema;

var directions = 'enter go'.split(' ')
var TimeEntry = new schema({
                           entry_date: {type: Date, default: Date.now},
                           direction: { type: String, enum: directions },
                           last_changed: {type: Date, default: Date.now}
});

mongoose.model('TimeEntry', TimeEntry);

console.log('connecting to mongodb on ' + mongodb_url);
mongoose.connect(mongodb_url, { server: { poolSize: 2 }});
console.log('connected to mongodb');
