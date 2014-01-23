/**
 * read the database url respcting the environment (local or openshift)
 */
function dburl() {
	var fs = require('fs');
	var db_config = JSON.parse(fs.readFileSync('./db-conf.json','utf8'));
    
    
    var dbenv;
    process.execArgv.forEach(function(val, index, array) {
        if(val.contains('--dbenv')) {
            dbenv = val.substring(val.indexOf('=')+1, val.length);
            console.log('database environment: ' + dbenv);
        }
    });
    
    var dbconfig = (process.env.OPENSHIFT_APP_UUID || dbenv == 'openshift' ? db_config.openshift : db_config.local);
    if(process.env.OPENSHIFT_APP_UUID || dbenv === 'openshift') {
        dbconfig = db_config.openshift;
    } else if (dbenv === 'local') {
        dbconfig = db_config.local;
    } else if (dbenv === 'jupiter') {
        dbconfig = db_config.jupiter;
    }
    
	return 'mongodb://' + dbconfig.user + ':' + dbconfig.password + '@' + dbconfig.uri;
}

/**
 * adding the contains method to the String object
 */
if(!String.prototype.contains) {
    String.prototype.contains = function (arg) {
        return !!~this.indexOf(arg);
    };
}

// Here you can find the schema definition of noodle data.
// The top element always is a 'noodle' which represents an appointment

console.log("init database");


var mongoose = require('mongoose');
var schema   = mongoose.Schema;

// TimeEntry
var directions = 'enter go'.split(' ')
var TimeEntry = new schema({
entry_date:   {type: Date, required: true, default: Date.now, index: true}
    , direction:    {type: String, enum: directions, required: true}
    , last_changed: {type: Date, default: Date.now, required: true}
});
mongoose.model('TimeEntry', TimeEntry);

// StatisticsDay
var StatsDay = new schema({
      date:                  {type: Date, required: true, default: Date.now, index: true, unique: true}
    , actual_working_time:   {type: Number, required: true, default: 0}
    , planned_working_time:  {type: Number, required: true, default: 0}
    , is_working_day:        {type: Boolean, required: true, default: false}
    , is_complete  :         {type: Boolean, required: true}
    , last_changed:          {type: Date, required: true, default: Date.now}
});
mongoose.model('StatsDay', StatsDay);


var mongodb_url = dburl();

console.log('connecting to mongodb on ' + mongodb_url);
mongoose.connect(mongodb_url, { server: { poolSize: 2 }});
console.log('connected to mongodb');

