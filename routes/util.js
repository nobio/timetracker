var mongoose = require('mongoose');
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

