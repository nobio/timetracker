var mongoose = require('mongoose');
var moment = require('moment');
var TimeEntry = mongoose.model('TimeEntry');
var StatsDay = mongoose.model('StatsDay');

var DEFAULT_BREAK_TIME = 45 * 60 * 1000; // 45 min in milli seconds

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
};
/*
 * checks if an object is empty; this is something different to undefined or null (sigh...)
 */
exports.isEmpty = function(obj) {
    return isEmpty(obj);
};

function isEmpty(obj) {
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            return false;
        }
    }
    return true;
};


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
        if (err) {
            callback(err);
            return;
        }
        
        // entries should have zero or one entry
        if (direction == 'enter') {// enter
            if ( typeof (entry) == 'undefined' || entry.direction == 'go') {
                callback();
                // everything's ok
            } else {
                callback(new Error('When entering there must be either no entry or a "go" entry earlier this day'));
            }
        } else {// go
            if ( typeof (entry) !== 'undefined' && entry.direction == 'enter') {
                callback();
                // everything's ok
            } else {
                callback(new Error('When leaving there must be an "enter" entry earlier this day'));
            }
        }
    });
};

exports.getBusytimeByDate = function(dt, callback) {
    
    // first get all entries for this day....
    this.getTimeEntriesByDate(dt, function(err, timeentries) {
        
        if (err) {
            callback(new Error('Error while reading Time Entry: ' + id + " " + err.message));
        } else {
            
            if (timeentries.length === 0) {
                
                callback(new Error('Es gibt keine Einträge für diesen Tag (' + dt.format('DD.MM.YYYY') + ')'), 0);
                
            } else if (timeentries.length % 2 !== 0) {
                
                callback(new Error('Bitte die Einträge für diesen Tag (' + dt.format('DD.MM.YYYY') + ') vervollständigen'), 0);
                
            } else {
                
                var busytime;
                for (var n = timeentries.length - 1; n > 0; n -= 2) {
                    // this must be a go-event
                    if (timeentries[n].direction !== 'go') {
                        callback(new Error('Die Reihenfolge der Kommen/Gehen-Einträge am ' + dt.format('DD.MM.YYYY') + ' scheint nicht zu stimmen.'), 0);
                    }
                    
                    var end = timeentries[n].entry_date;
                    var start = timeentries[n - 1].entry_date;
                    var diff = moment.duration(moment(end).subtract(moment(start)));
                    
                    if (!busytime) {
                        busytime = diff;
                    } else {
                        busytime.add(diff, 'millisecond');
                    }
                }
                
                // when ther have been only 2 entries we reduce the busytime by 45 minutes (default pause)
                if(timeentries.length === 2) {
                    busytime = busytime - DEFAULT_BREAK_TIME;
                }
                
                callback(null, dt, busytime);
            }
            
        }
        
    });
};

/*
 * reads the last entry for a given date
 */
exports.getLastTimeEntryByDate = function(dt, callback) {
    var dtStart = moment(dt);
    dtStart.hours(0);
    dtStart.minutes(0);
    dtStart.seconds(0);
    var dtEnd = moment(dtStart).add('days', '1');
    
    console.log(dtStart.toDate() + "\n" + dtEnd.toDate());
    
    TimeEntry.find({
        entry_date : {
            $gte : dtStart,
            $lt : dtEnd
        }
    }).skip(0).limit(1).sort({
        entry_date : -1
    }).exec(function(err, docs) {
        if (docs.length == 0) {
            callback(err);
        } else {
            callback(err, docs[0]);
        }
    });
};
/*
 * reads all time entries for a given date
 */
exports.getTimeEntriesByDate = function(dt, callback) {
    //console.log('getTimeEntriesByDate received date: ' + moment(dt).format('DD.MM.YYYY HH:mm:ss'));
    
    var dtStart = moment(dt);
    dtStart.hours(0);
    dtStart.minutes(0);
    dtStart.seconds(0);
    var dtEnd = moment(dtStart).add('days', '1');
    
    //    console.log(dtStart.toDate() + "\n" + dtEnd.toDate());
    
    TimeEntry.find({
        entry_date : {
            $gte : dtStart,
            $lt : dtEnd
        }
    }).skip(0).sort({
        entry_date : 1
    }).exec(function(err, timeentries) {
        if (err) {
            callback(err);
        } else {
            callback(err, timeentries);
        }
    });
};
/*
 * reads the number of all TimeEntries in database
 */
exports.getNumberOfTimeEntries = function(callback) {
    
    TimeEntry.find(function(err, timeentries) {
        if (err) {
            callback(err);
        } else {
            callback(err, timeentries.length);
        }
    });
};
/*
 * returns the aggregated statistics for a given time range defined by start and end
 */
exports.getStatsByRange = function(dtStart, dtEnd, callback) {
    
    var actual_working_time = -1;
    var planned_working_time = -1;
    
    StatsDay.find({
        date : {
            $gte : dtStart,
            $lt : dtEnd
        }
    }).sort({
        date : -1
    }).exec(function(err, stats) {
        var innerData = [{0:0}];
        var innerComp = [{0:0}];
        var idx = 0;
        stats.forEach(function(stat) {
            // console.log(" >>>>   " + stat.actual_working_time + " " + stat.planned_working_time);
            actual_working_time += stat.actual_working_time;
            planned_working_time += stat.planned_working_time;
            innerData[idx] = {
                "x" : moment(stat.date).format('YYYY-MM-DD'),
                "y" : stat.actual_working_time / 60 / 60 / 1000
            };
            innerComp[idx] = {
                "x" : moment(stat.date).format('YYYY-MM-DD'),
                "y" : 7.8
            };
            idx++;
        });
        callback(null, {
            actual_working_time : actual_working_time,
            planned_working_time : planned_working_time,
            inner_data : innerData,
            inner_comp : innerComp
        });
    });
};
/*
 * returns the aggregated statistics for a given day
 */
exports.getStatsByDate = function(date) {
    
    var actual_working_time = -1;
    var planned_working_time = -1;
    
    StatsDay.find({
        date : {
            $gte : dtStart,
            $lt : dtEnd
        }
    }).sort({
        date : -1
    }).exec(function(err, stats) {
        stats.forEach(function(stat) {
            console.log(stat + " " + stat.actual_working_time + " " + stat.planned_working_time);
            actual_working_time += stat.actual_working_time;
            planned_working_time += stat.planned_working_time;
        });
        console.log(actual_working_time + " " + planned_working_time);
        return {
            actual_working_time : actual_working_time,
            planned_working_time : planned_working_time
        };
    });
};

exports.getFirstTimeEntry = function(callback) {
    TimeEntry.aggregate([{
                         $group : {
                            _id : 0,
                            age : {
                                $min : "$entry_date"
                            }
                         }
                         }]).exec(function(err, timeentries) {
        callback(err, timeentries[0]);
    });
};

exports.getLastTimeEntry = function(callback) {
    TimeEntry.aggregate([{
                         $group : {
                            _id : 0,
                            age : {
                                $max : "$entry_date"
                            }
                         }
                         }]).exec(function(err, timeentries) {
        callback(err, timeentries[0]);
    });
};

exports.deleteAllStatsDays = function(callback) {
    var size;
    StatsDay.find(function(err, statsdays) {
        size = statsdays.length;
        statsdays.forEach(function(statsday) {
            //console.log('removing ' + statsday);
            statsday.remove();
        });
        console.log('deleted ' + size + ' items');
        callback(null, {
            size : size
        });
    });
};

