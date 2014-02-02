var mongoose = require('mongoose');
var moment = require('moment');
//var timzone = require('moment-timezone');
var TimeEntry  = mongoose.model('TimeEntry');
var StatsDay = mongoose.model('StatsDay');


/*
 * takes the date and removes all time components
 * date expected to be a moment object
 */
exports.stripdownToDate = function(date) {
    var d = date;
    d.millisecond(0);
    d.second(0);
    d.minutes(0);
    d.hours(0);
    
    return d;
}

/*
 * checks if an object is empty; this is something different to undefined or null (sigh...)
 */
exports.isEmpty = function(obj) {
    return isEmpty(obj);
}

function isEmpty(obj) {
    for(var key in obj) {
        if(obj.hasOwnProperty(key))
            return false;
    }
    return true;
}


/*
 * marks/unmarks a day as holiday
 */
exports.setHoliday = function (date, holiday, callback) {
    
    var isWorkingDay = (holiday == 'false');
	console.log('date: ' + date + ', holiday: ' + holiday + ', isWorkingDay: ' + isWorkingDay);
    
    StatsDay.find({date: date}, function(err, stats) {
        console.log(err + " " + stats);
        if(err) {
            callback(err);
        } else {
            
            if(isEmpty(stats)) {
                stats = new StatsDay({
                date: date
                    , actual_working_time: 0
                    , planned_working_time: 0
                    , is_working_day: isWorkingDay
                    , is_complete: true
                });
                
                console.log("I'm saving now this " + stats)
                stats.save(function(err, stat, numberAffected) {
                    console.log(err + " " + stat);
                    if(err) {
                        callback(err);
                    } else {
                        callback(null);
                    }
                });
                
            } else {
                console.log("I'm updating now the stats entry for " + stats.date);
                var planned_working_time = (isWorkingDay === 'true' ? 0 : 7.8);
                if(stats.length === 0 || stats.length > 1) {
                    callback(new Error('somethings corrupt with your StatsDay data. I received ' + stats.length + ' entries for ' + date + ' instead of 1 entry'));
                }
                StatsDay.update(
                                {_id: stats[0]._id},
                                {$set:{is_working_day: isWorkingDay, planned_working_time: planned_working_time}},
                                {upsert:true},
                                function (err, numberAffected, raw) {
                                    console.log(numberAffected);
                                    console.log(raw);
                                    if(err) {
                                        callback(err);
                                    } else {
                                        callback(null);
                                    }
                                });
            }
        }
    });
}

/* ================================================================== */
/* ======================== INTERNAL METHODS ======================== */
/* ================================================================== */

/*
 * loads the TimeEntries from the given day and checking, denpending on direction,
 *   when direction == "enter" -> the last entry of this given day must either not exist or be "go"; otherwise -> error
 *   when direction == "go"    -> the last entry of this given day must be "enter"; if no entry exists or the last was "go" -> error
 *   dt is expected in ISO format
 */
exports.validateRequest = function(direction, dt, callback) {
    
    this.getLastTimeEntryByDate(dt, function(err, entry) {
        if(err) {
            callback(err);
            return;
        }
        
        // entries should have zero or one entry
        if(direction == 'enter') {  // enter
            if(typeof(entry) == 'undefined' || entry.direction == 'go') {
                callback(); // everything's ok
            } else {
                callback(new Error('When entering there must be either no entry or a "go" entry earlier this day'));
            }
        } else { // go
            if(typeof(entry) !== 'undefined' && entry.direction == 'enter') {
                callback(); // everything's ok
            } else {
                callback(new Error('When leaving there must be an "enter" entry earlier this day'));
            }
        }
    });
}

/*
 * reads the last entry for a given date
 */
/*
exports.getLastTimeEntryByDate = function(dt, callback) {
    var dtStart = moment(dt).tz("Europe/Berlin"); dtStart.hours(0); dtStart.minutes(0); dtStart.seconds(0);
    var dtEnd = moment(dtStart).tz("Europe/Berlin").add('days', '1');
    
    console.log(dtStart.toDate() + "\n" + dtEnd.toDate());
    
    TimeEntry.find({entry_date: {$gte: dtStart, $lt: dtEnd}})
    .skip(0)
    .limit(1)
    .sort({entry_date: -1})
    .exec(function(err, docs) {
        if(docs.length == 0) {
            callback(err);
        } else {
            callback(err, docs[0]);
        }
    });
}
 */

/*
 * reads all time entries for a given date
 */
exports.getTimeEntriesByDate = function(dt, callback) {
    console.log('getTimeEntriesByDate received date: ' + moment(dt).format('DD.MM.YYYY HH:mm:ss'));
    
    var dtStart = moment(dt).tz("Europe/Berlin"); dtStart.hours(0); dtStart.minutes(0); dtStart.seconds(0);
    var dtEnd = moment(dtStart).tz("Europe/Berlin").add('days', '1');
    
    console.log(dtStart.toDate() + "\n" + dtEnd.toDate());
    
    TimeEntry.find({entry_date: {$gte: dtStart, $lt: dtEnd}})
    .skip(0)
    .sort({entry_date: 1})
    .exec(function(err, timeentries) {
        if(err) {
            callback(err);
        } else {
            callback(err, timeentries);
        }
    });
}

/*
 * reads the number of all TimeEntries in database
 */
exports.getNumberOfTimeEntries = function(callback) {
    
    TimeEntry.find(function(err, timeentries) {
        if(err) {
            callback(err);
        } else {
            callback(err, timeentries.length);
        }
    })
}

/*
 * returns the aggregated statistics for a given time range defined by start and end
 */
exports.getStatsByRange = function(dtStart, dtEnd) {
    
    var actual_working_time = -1;
    var planned_working_time = -1;
    
    StatsDay.find({date: {$gte: dtStart, $lt: dtEnd}})
    .sort({date: -1})
    .exec(function(err, stats) {
        stats.forEach(function(stat) {
            //            console.log(stat + " " + stat.actual_working_time + " " + stat.planned_working_time);
            actual_working_time += stat.actual_working_time;
            planned_working_time += stat.planned_working_time;
        });
        //        console.log(actual_working_time + " " + planned_working_time);
        return {actual_working_time:actual_working_time, planned_working_time:planned_working_time};
    });
}


/*
 * returns the aggregated statistics for a given day
 */
exports.getStatsByDate = function(date) {
    
    var actual_working_time = -1;
    var planned_working_time = -1;
    
    StatsDay.find({date: {$gte: dtStart, $lt: dtEnd}})
    .sort({date: -1})
    .exec(function(err, stats) {
        stats.forEach(function(stat) {
            console.log(stat + " " + stat.actual_working_time + " " + stat.planned_working_time);
            actual_working_time += stat.actual_working_time;
            planned_working_time += stat.planned_working_time;
        });
        console.log(actual_working_time + " " + planned_working_time);
        return {actual_working_time:actual_working_time, planned_working_time:planned_working_time};
    });
}


