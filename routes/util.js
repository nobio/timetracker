var mongoose = require('mongoose');
var moment = require('moment');
var TimeEntry = mongoose.model('TimeEntry');
var StatsDay = mongoose.model('StatsDay');

var DEFAULT_BREAK_TIME = 45 * 60 * 1000; // 45 min in milli seconds

/*
 * takes the date and removes all time components
 * date expected to be a moment object
 */
exports.stripdownToDateBerlin = (date) => {
    var d = moment.tz(date / 1, 'Europe/Berlin');
    d.millisecond(0);
    d.second(0);
    d.minutes(0);
    d.hours(0);

    return d;
};
/*
 * checks if an object is empty; this is something different to undefined or null (sigh...)
 */
exports.isEmpty = (obj) => {
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

Number.prototype.toRad = () => {
    return this * Math.PI / 180;
}

function toRad(num) {
    return num * Math.PI / 180;
}

function formatDistance(distOrig) {
    var distKm = parseInt(distOrig);
    var distM = (distOrig - distKm) * 1000;
    distM = Math.round(distM * 100) / 100;

    return {
        kilometer: distKm,
        meter: distM
    };
}


// Reused code - copyright Moveable Type Scripts - retrieved May 4, 2010.
// http://www.movable-type.co.uk/scripts/latlong.html
// Under Creative Commons License http://creativecommons.org/licenses/by/3.0/
// returns the distance in km
function calculateDistance(lat1, lon1, lat2, lon2) {
    var R = 6371; // km -> m
    var dLat = toRad(lat2 - lat1); //;(lat2-lat1).toRad();
    var dLon = toRad(lon2 - lon1); //(lon2-lon1).toRad();
    //    var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(lat1.toRad()) * Math.cos(lat2.toRad()) * Math.sin(dLon/2) * Math.sin(dLon/2);
    var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c;
    return d;
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
exports.validateRequest = (direction, dt, longitude, latitude, callback) => {

    this.getLastTimeEntryByDate(dt, (err, last_entry) => {
        if (err) {
            callback(err);
            return;
        }

        if (typeof(last_entry) == 'undefined') {
            if (direction == 'go') {
                callback(new Error('Please enter a "enter" as a first entry of the day'));
                return;
            }
            callback();
            return;
        }

        // check if last entry was not during the last 3 seconds
        console.log('time difference between last entry and this entry: ' + (dt - last_entry.entry_date) / 1000);
        if (dt - last_entry.entry_date < 3000) { // ms not 
            callback(new Error('Seems to be a double entry. The last entry is not older than 3 seconds.'));
            return;
        }

        /*
        // check if last entry was not within 10m
        console.log("distance: " + JSON.stringify(formatDistance(calculateDistance(latitude, longitude, last_entry.latitude, last_entry.longitude))));
        console.log("distance: " + calculateDistance(latitude, longitude, last_entry.latitude, last_entry.longitude));
        var distance_to_last_entry_in_meter = 1000 * calculateDistance(latitude, longitude, last_entry.latitude, last_entry.longitude);
        if(distance_to_last_entry_in_meter < 10) {
            callback(new Error('Seems to be a double entry. The last entry was done closer than ' + distance_to_last_entry_in_meter + ' meter'));
            return;
        }
        */

        // entries should have zero or one entry
        if (direction == 'enter' && last_entry.direction == 'enter') {
            callback(new Error('When entering there must be either no entry or a "go" entry earlier this'));
            return;
        } else if (direction == 'go' && last_entry.direction == 'go') {
            callback(new Error('When leaving there must be an "enter" entry earlier this'));
            return;
        }
        callback();
        return;
    });
};


exports.getBusytimeByDate = (dt, callback) => {

    // first get all entries for this day....
    this.getTimeEntriesByDate(dt, (err, timeentries) => {
        if (err) {
            callback(new Error('Error while reading Time Entry: ' + id + " " + err.message));
        } else {

            if (timeentries.length === 0) {
                callback(new Error('Es gibt keine Einträge für diesen Tag (' + dt.format('DD.MM.YYYY') + ')'), 0);
            } else if (timeentries.length % 2 !== 0) {
                callback(new Error('Bitte die Einträge für diesen Tag (' + dt.format('DD.MM.YYYY') + ') vervollständigen'), 0);
            } else {

                var busytime = 0;
                for (var n = timeentries.length - 1; n > 0; n -= 2) {
                    // this must be a go-event
                    if (timeentries[n].direction !== 'go') {
                        callback(new Error('Die Reihenfolge der Kommen/Gehen-Einträge am ' + dt.format('DD.MM.YYYY') + ' scheint nicht zu stimmen.'), 0);
                    }

                    var end = timeentries[n].entry_date;
                    var start = timeentries[n - 1].entry_date;

                    busytime = busytime + (end - start);
                    //console.log(dt + ": " + start + " -> " + end + "    = " + busytime + " (" + (busytime / 1000/60/60) + ")");

                }

                // when ther have been only 2 entries we reduce the busytime by 45 minutes (default pause)
                if (timeentries.length === 2) {
                    busytime = busytime - DEFAULT_BREAK_TIME;
                }
                //console.log(dt + " => " + busytime + " " + (busytime/1000/60/60));

                callback(null, dt, busytime);
            }

        }

    });
};

/*
 * reads the last entry for a given date
 */
exports.getLastTimeEntryByDate = (dt, callback) => {
    var dtStart = moment(dt);
    dtStart.hours(0);
    dtStart.minutes(0);
    dtStart.seconds(0);
    var dtEnd = moment(dtStart).add('days', '1');

    console.log(dtStart.toDate() + "\n" + dtEnd.toDate());

    TimeEntry.find({
        entry_date: {
            $gte: dtStart,
            $lt: dtEnd
        }
    }).skip(0).limit(1).sort({
        entry_date: -1
    }).exec((err, docs) => {
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
exports.getTimeEntriesByDate = (dt, callback) => {
    //console.log('getTimeEntriesByDate received date: ' + moment(dt).format('DD.MM.YYYY HH:mm:ss'));

    var dtStart = moment(dt);
    dtStart.hours(0);
    dtStart.minutes(0);
    dtStart.seconds(0);
    var dtEnd = moment(dtStart).add('days', '1');

    //    console.log(dtStart.toDate() + "\n" + dtEnd.toDate());

    TimeEntry.find({
        entry_date: {
            $gte: dtStart,
            $lt: dtEnd
        }
    }).skip(0).sort({
        entry_date: 1
    }).exec((err, timeentries) => {
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
exports.getNumberOfTimeEntries = (callback) => {
    return getNumberOfTimeEntries(callback);
};

/*
 * reads the number of all TimeEntries in database
 */
getNumberOfTimeEntries = (callback) => {

    TimeEntry.find((err, timeentries) => {
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
exports.getStatsByRange = (dtStart, dtEnd, callback) => {
    console.log(">>> searching data for date between $1 and $2", moment(dtStart).format('YYYY-MM-DD'), moment(dtEnd).format('YYYY-MM-DD'));

    StatsDay.find({
        date: {
            $gte: dtStart,
            $lt: dtEnd
        }
    }).sort({
        date: -1
    }).exec((err, stats) => {
        var innerData = [{
            0: 0
        }];
        var innerComp = [{
            0: 0
        }];
        var idx = 0;
        var actual_working_time = -1;
        var planned_working_time = -1;
        var average_working_time = -1;

        // calculating actual working time
        stats.forEach((stat) => {
            actual_working_time += stat.actual_working_time;
        });
        average_working_time = actual_working_time / stats.length / 60 / 60 / 1000;

        // console.log("average_working_time = " + average_working_time);
        // console.log("length = " + stats.length);

        stats.forEach((stat) => {
            //console.log(" >>>>   " + stat.actual_working_time + " " + stat.planned_working_time + " -> " + stat._id);
            //actual_working_time += stat.actual_working_time;
            planned_working_time += stat.planned_working_time;
            innerData[idx] = {
                "x": moment(stat.date).format('YYYY-MM-DD'),
                "y": Math.round(stat.actual_working_time / 60 / 60 / 1000 * 100) / 100 //rounding 2 digits after comma
            };
            innerComp[idx] = {
                "x": moment(stat.date).format('YYYY-MM-DD'),
                "y": Math.round(average_working_time * 100) / 100 //rounding 2 digits after comma
            };
            idx++;
        });

        callback(null, {
            actual_working_time: actual_working_time,
            planned_working_time: planned_working_time,
            average_working_time: average_working_time,
            inner_data: innerData,
            inner_comp: innerComp
        });
    });
};

exports.getStatsByTimeBox = (timeUnit, callback) => {
    var data;

    StatsDay.find().sort({
        date: 1
    }).exec((err, stats) => {
        if (err) {
            callback(err);
        } else {
            if ('month' === timeUnit) {
                data = getStatsByTimeBoxTimeUnit(stats, 'gggg-MM');
            } else if ('week' === timeUnit) {
                data = getStatsByTimeBoxTimeUnit(stats, 'gggg-ww');
            } else if ('day' === timeUnit) {
                data = getStatsByTimeBoxDay(stats);
            } else if ('weekday' === timeUnit) {
                data = getStatsByTimeBoxTimeWeekDay(stats);
            } else {
                callback(new Error('time unit \'' + timeUnit + '\' is invalid'));
            }

            callback(null, {
                actual_working_time: 0,
                planned_working_time: 0,
                average_working_time: 1,
                inner_data: data,
                inner_comp: {}
            });

        }

    });
}

/* function of reduce */
function add(a, b) {
    //console.log("a=" + a + ", b=" + b);
    return a + b;
}

function varianz(a, curr, idx, array) {
    if (idx == array.length - 1) {
        var mean = (a + curr) / array.length;
        var tmp = 0;
        array.forEach((val) => {
            tmp += (val - mean) * (val - mean);
        });
        return Math.sqrt(tmp / array.length);
    }

    return a + curr;
}

function getStatsByTimeBoxTimeUnit(stats, timeUnitFormatString) {
    console.log(stats);
    var data = [{
        0: 0
    }];
    var time_unit_stats = [];
    console.log(time_unit_stats.reduce(add, 0));

    var lastTimeUnit;
    var actualTimeUnit;
    var idx = 0;
    stats.forEach((stat) => {
        actualTimeUnit = moment(stat.date).format(timeUnitFormatString);
        if (lastTimeUnit != actualTimeUnit) {
            // calculate statistics of last week
            //            var sum = time_unit_stats.reduce((a, b) => a + b, 0); // reduce funciton; but not with version 0.10.5. It comes later...
            //            var sum = time_unit_stats.reduce(function(a, b) {return a + b;}, 0); // reduce function
            var sum = time_unit_stats.reduce(add, 0); // reduce function
            var avg = sum / time_unit_stats.length;
            //var variance = time_unit_stats.reduce(varianz, 0);
            //console.log(moment(stat.date).format('YYYY-MM-DD') + " / " + moment(avg).format('hh:mm:ss') + "(" + Math.round(avg / 60 / 60 / 1000 * 100) / 100 + ")" + " / " + moment(sum).format('YYYY-MM-DD'));
            data[idx] = {
                 x: moment(stat.date).format('YYYY-MM-DD')
                ,y: Math.round(avg / 60 / 60 / 1000 * 100) / 100 //rounding 2 digits after comma
            };
/*
                ,working_time: avg
                ,working_time_rounded_hours: Math.round(avg / 60 / 60 / 1000 * 100) / 100 //rounding 2 digits after comma
                ,date: stat.date
                ,variance: variance
                ,variance_rounded: Math.round(variance / 60 / 60 / 1000 * 100) / 100
*/            // reset to next week
            lastTimeUnit = actualTimeUnit;
            time_unit_stats = [];
            idx++;
        }
        time_unit_stats.push(stat.actual_working_time);
    });
    return data;
}

function getStatsByTimeBoxDay(stats) {
    var data = [{
        0: 0
    }];

    var idx = 0;
    stats.forEach((stat) => {
        data[idx] = {
            "x": moment(stat.date).format('YYYY-MM-DD'),
            "y": Math.round(stat.actual_working_time / 60 / 60 / 1000 * 100) / 100 //rounding 2 digits after comma
                /*
                working_time: stat.actual_working_time,
                working_time_rounded_hours: Math.round(stat.actual_working_time / 60 / 60 / 1000 * 100) / 100, //rounding 2 digits after comma
                date: stat.date,
                variance: 0,
                variance_rounded: 0.00
                */
        };
        idx++;
    });
    return data;
}

function getStatsByTimeBoxTimeWeekDay(stats) {
    var data = [{
        0: 0
    }];
    var time_data = {
        "Mo": {
            duration: 0,
            count: 0
        },
        "Tu": {
            duration: 0,
            count: 0
        },
        "We": {
            duration: 0,
            count: 0
        },
        "Th": {
            duration: 0,
            count: 0
        },
        "Fr": {
            duration: 0,
            count: 0
        },
        "Sa": {
            duration: 0,
            count: 0
        },
        "Su": {
            duration: 0,
            count: 0
        }
    };

    stats.forEach(stat => {
        var timeUnit = moment(stat.date).format("dd");
        time_data[timeUnit].duration += stat.actual_working_time;
        time_data[timeUnit].count += 1;
    });

    // calculate statistics of last week
    data[0] = renderOneData(time_data.Mo, "Mo");
    data[1] = renderOneData(time_data.Tu, "Tu");
    data[2] = renderOneData(time_data.We, "We");
    data[3] = renderOneData(time_data.Th, "Th");
    data[4] = renderOneData(time_data.Fr, "Fr");
    data[5] = renderOneData(time_data.Sa, "Sa");
    data[6] = renderOneData(time_data.Su, "Su");
    return data;
}

function renderOneData(data, weekday) {
    // TODO: variance!!!!
    var avg = data.duration / data.count;
    return {
        "x": weekday,
        "y": Math.round(avg / 60 / 60 / 1000 * 100) / 100 //rounding 2 digits after comma
            /*
            working_time: avg,
            working_time_rounded_hours: Math.round(avg / 60 / 60 / 1000 * 100) / 100, //rounding 2 digits after comma
            date: weekday,
            variance: 0,
            variance_rounded: 0.0
            */
    };
}

/*
 * returns the aggregated statistics for a given day
 */
exports.getStatsByDate = (date) => {

    var actual_working_time = -1;
    var planned_working_time = -1;

    StatsDay.find({
        date: {
            $gte: dtStart,
            $lt: dtEnd
        }
    }).sort({
        date: -1
    }).exec((err, stats) => {
        stats.forEach(stat => {
            console.log(stat + " " + stat.actual_working_time + " " + stat.planned_working_time);
            actual_working_time += stat.actual_working_time;
            planned_working_time += stat.planned_working_time;
        });
        console.log(actual_working_time + " " + planned_working_time);
        return {
            actual_working_time: actual_working_time,
            planned_working_time: planned_working_time
        };
    });
};

exports.getFirstTimeEntry = (callback) => {
    TimeEntry.aggregate([{
        $group: {
            _id: 0,
            age: {
                $min: "$entry_date"
            }
        }
    }]).exec((err, timeentries) => {
        callback(err, timeentries[0]);
    });
};

exports.getLastTimeEntry = (callback) => {
    TimeEntry.aggregate([{
        $group: {
            _id: 0,
            age: {
                $max: "$entry_date"
            }
        }
    }]).exec((err, timeentries) => {
        callback(err, timeentries[0]);
    });
};

exports.deleteAllStatsDays = (callback) => {
    var size;
    StatsDay.find((err, statsdays) => {
        size = statsdays.length;
        statsdays.forEach((statsday) => {
            //console.log('removing ' + statsday);
            statsday.remove();
        });
        console.log('deleted ' + size + ' items');
        callback(null, {
            size: size
        });
    });
};

exports.createTimeEntry = (direction, datetime, longitude, latitude, callback) => {

    this.validateRequest(direction, datetime, longitude, latitude, (err) => {

        if (err) {
            console.log('exports.createTimeEntry received an error: ' + err);
            callback(err);
        } else {
            new TimeEntry({
                entry_date: datetime,
                direction: direction,
                longitude: longitude,
                latitude: latitude
            }).save((err, timeentry) => {
                // and now add the size to the mongoose-JSON (needs to be converted to an object first)
                var t = timeentry.toObject();
                getNumberOfTimeEntries((err, size) => {
                    t.size = size;
                    if (err) {
                        callback(err);
                    } else {
                        callback(err, t);
                    }
                });

            });
        }
    });

};

exports.removeDoublets = (callback) => {
    var lastTimeentry;
    var count = 0;
    TimeEntry.find().sort({
        entry_date: 1
    }).exec((err, timeentries) => {
        timeentries.forEach((timeentry) => {
            if (lastTimeentry !== undefined) {
                if (moment(timeentry.entry_date).diff(lastTimeentry.entry_date) == 0 &&
                    timeentry.direction == lastTimeentry.direction) {
                    timeentry.remove();
                    count++;
                    console.log("removing timeentry " + timeentry);
                } else {
                    lastTimeentry = timeentry;
                }
            } else {
                lastTimeentry = timeentry;
            }
        });
        console.log(count + ' doublets removed');
        callback(err, count);
    });
};
