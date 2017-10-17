var db_config = require('./db-conf.json');



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
    , longitude:    {type: Number, required: false}
    , latitude:     {type: Number, required: false}
});
mongoose.model('TimeEntry', TimeEntry);
mongoose.model('TimeEntryBackup', TimeEntry);

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


var mongodb_url = 'mongodb://' + db_config.mlab.user + ':' + db_config.mlab.password + '@' + db_config.mlab.uri;
var monoddb_options = db_config.mlab.options;

console.log('connecting to mongodb on ' + mongodb_url + ' with options ' + JSON.stringify(monoddb_options));
mongoose.connect(mongodb_url, monoddb_options).then(
  () => { console.log("mongodb is ready to use.")},
  err => { console.log("error while connecting mongodb:" + err) }
);
