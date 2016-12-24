var mongoose = require('mongoose');
var moment = require('moment');
var fs = require('fs');
var util = require('./util');

var TimeEntry = mongoose.model('TimeEntry');
var TimeEntryBackup = mongoose.model('TimeEntryBackup');
var StatsDay = mongoose.model('StatsDay');

var DEFAULT_WORKING_TIME = 7.8 * 60 * 60 * 1000; // 7.8 hours in milli seconds


/*
 * deletes all TimeEntry-items from database. This should only be used during development time
 * and later either deleted or put behind some special user privileges
 *
 * curl -X DELETE http://localhost:30000/entries
 */
exports.deleteAllTimeEntries = function(req, res) {
    var size;
    TimeEntry.find(function(err, timeentries) {
        size = timeentries.length;
        timeentries.forEach(function(timeentry) {
            console.log(timeentry);
            timeentry.remove();
        });
        console.log('deleted ' + size + ' items');
        res.send({
            size: size
        });
    });
};

/*
 * deletes all StatsDay-items from database. This should only be used during development time
 * and later either deleted or put behind some special user privileges
 *
 * curl -X DELETE http://localhost:30000/stats
 */
exports.deleteAllStatsDays = function(req, res) {
    util.deleteAllStatsDays(function(err, result) {
        if (err) {
            res.send(500, err);
        } else {
            res.send(result);
        }
    });
};

/*
 * calculates the statistics for today +/- one month and stores them in database
 *
 * curl -X PUT http://localhost:30000/stats
 */
exports.calcStats = function(req, res) {
    // first remove all doublets
    util.removeDoublets(function(err, deletedDoublets) {

        util.deleteAllStatsDays(function(err, result) {

            util.getFirstTimeEntry(function(err, firstTimeentry) {
                if (!firstTimeentry) {
                    res.send({
                        message: 'no entries in database'
                    });
                    return;
                }

                util.getLastTimeEntry(function(err, lastTimeentry) {

                    var date = moment(firstTimeentry.age);
                    date.hours(0);
                    date.minutes(0);
                    date.seconds(0);

                    while (date <= moment(lastTimeentry.age)) {
                        //console.log('calculating for day ' + date.format('YYYY-MM-DD'));
                        var dt = moment(date);

                        util.getBusytimeByDate(dt, function(err, d, busytime) {
                            if (err) {
                                // when this is not a working day, ignore it; otherwise set "isComplete" to false
                                //console.log('****** ' + d + ': ' + err);
                            } else {
                                // update the StatsDay entry for this day
                                //console.log('busy time at ' + d.format('YYYY-MM-DD') + ': ' + moment.duration(busytime).hours() + ':' + moment.duration(busytime).minutes());

                                StatsDay.findOneAndUpdate({
                                        date: d
                                    }, {
                                        //                    date: d,
                                        actual_working_time: busytime / 1,
                                        planned_working_time: DEFAULT_WORKING_TIME,
                                        is_working_day: true,
                                        is_complete: true,
                                        last_changed: new Date()
                                    }, {
                                        new: true
                                    },
                                    function(err, statsday) {
                                        if (err) {
                                            //console.log(err);
                                        } else {
                                            //console.log('successfully updated record for day ' + moment(d).format('YYYY-MM-DD') + ' ' + statsday);
                                            if (statsday == null) {
                                                new StatsDay({
                                                    date: d,
                                                    actual_working_time: busytime / 1,
                                                    planned_working_time: DEFAULT_WORKING_TIME,
                                                    is_working_day: true,
                                                    is_complete: true,
                                                    last_changed: new Date()
                                                }).save(function(err) {
                                                    if (err) {
                                                        console.log(err);
                                                    }
                                                });
                                            }
                                        }
                                    });
                            }
                        });

                        date = date.add('day', '1');
                    }

                    if (res) {
                        var reply = {
                            firstTimeentry: firstTimeentry,
                            lastTimeentry: lastTimeentry,
                            deletedDoublets: deletedDoublets
                        };
                        console.log(reply);
                        res.send(reply);
                    }
                });

            });
        });

    });

};

/*
 * creates random Time Entries; supposed to be used after cleaning the TimeEntry table
 *
 * curl -X PUT http://localhost:30000/admin/rnd_entries
 */
exports.setRandomTimeEntries = function(req, res) {

    var DAY_IN_SECS = 60 * 60 * 24;
    var now = moment().unix();
    var today = now - (now % DAY_IN_SECS);

    console.log(today);

    for (var t = today - 18 * DAY_IN_SECS; t < today + 180 * DAY_IN_SECS; t += DAY_IN_SECS) {

        var dt = moment(t);
        console.log(t + ': ' + dt.format('DD.MM.YYYY HH:mm:ss'));

        var countEntries = 1 + Math.floor(Math.random() * 3);
        console.log("Anzahl Eiträge: " + countEntries * 2);

        var pointer = t + 60 * 60 * 5;
        // 5 hours offset per day
        for (var i = 0; i < countEntries; i++) {
            var varianz = Math.floor(Math.random() * 60 * 60 * 4);
            // random range +/- 60 min
            var start = pointer + varianz - 60 * 60;

            varianz += Math.floor(Math.random() * 60 * 60 * 4);
            // random range +/- 30 min
            var end = start + varianz - 60 * 60;

            console.log("Start: " + moment(1000 * start).format('DD.MM.YYYY HH:mm:ss') + " - End: " + moment(1000 * end).format('DD.MM.YYYY HH:mm:ss'));
            pointer = end + 61 * 60;

            new TimeEntry({
                entry_date: moment(1000 * start),
                direction: 'enter',
                isWorkingDay: false
            }).save(function(err, timeentry) {
                if (err) {
                    console.log(err);
                }
            });

            new TimeEntry({
                entry_date: moment(1000 * end),
                direction: 'go',
                isWorkingDay: false
            }).save(function(err, timeentry) {
                if (err) {
                    console.log(err);
                }
            });
        }
    }

    res.send({
        now: today
    });
};

/* 
 * curl -X GET http://localhost:30000/statistics/aggregate?timeUnit=day
 * curl -X GET http://localhost:30000/statistics/aggregate?timeUnit=week
 * curl -X GET http://localhost:30000/statistics/aggregate?timeUnit=month
 * curl -X GET http://localhost:30000/statistics/aggregate?timeUnit=weekday
 */
exports.getStatsByTimeBox = function(req, res) {
    util.getStatsByTimeBox(req.param('timeUnit'), function(err, timeboxedStatistics) {

        //console.log(err + " " + timeboxedStatistics);

        if (err) {
            res.send({
                err: err.message
            });
        } else {
            var chart_data = {
                xScale: 'time',
                yScale: 'linear',
                type: 'bar',
                main: [{
                    data: timeboxedStatistics,
                }]
            };

            res.send(chart_data);
        }
    });
}

/*
 * returns the aggregated statistics for a given time day
 *
 *  curl -X GET http://localhost:30000/stats/1391295600000?timeUnit=month
 */
exports.getStatsDay = function(req, res) {
    var timeUnit = req.param('timeUnit');
    var dtStart = moment.unix(req.params.date / 1000);
    var dtEnd;

    if ('year' === timeUnit) {
        dtEnd = moment(dtStart).add('years', '1');
    } else if ('month' === timeUnit) {
        dtEnd = moment(dtStart).add('months', '1');
    } else if ('week' === timeUnit) {
        dtEnd = moment(dtStart).add('weeks', '1');
    } else if ('day' === timeUnit) {
        dtEnd = moment(dtStart).add('days', '1');
    }

    console.log("Start at " + dtStart.toDate() + "\nEnd at " + dtEnd.toDate());

    util.getStatsByRange(dtStart, dtEnd, function(err, calculatedBusyTime) {

        //console.log(calculatedBusyTime);

        var chart_data = {
            "xScale": ('day' === timeUnit ? "ordinal" : "time"),
            "yScale": "linear",
            "type": ('day' === timeUnit ? "bar" : "line-dotted"),
            "main": [{
                "data": calculatedBusyTime.inner_data,
            }],
            "comp": [{
                "type": "line",
                "data": calculatedBusyTime.inner_comp,
            }]
        };

        res.send({
            actual_working_time: calculatedBusyTime.actual_working_time,
            planned_working_time: calculatedBusyTime.planned_working_time,
            average_working_time: calculatedBusyTime.average_working_time,
            chart_data: chart_data
        });
    });
};

/*
 * generic Maintain function
 *
 * curl -X GET http://localhost:30000/admin/maintain
 */
exports.maintain = function(req, res) {
    /*
     TimeEntry.update({
     $set : {
     isWorkingDay : true
     }
     }, {
     multi : true
     }, function(err, numberAffected, raw) {
     console.log(err + " " + numberAffected);
     });
     */
    fs.readFile('timeentry_*.json', function(err, data) {
        if (err) {
            throw err;
        }
        console.log(data);
    });
    res.send(null);
};

/*
 * function to dump the mongodb to the local file system in order to be restored if needed
 *
 * curl -X POST http://localhost:30000/admin/dump/timeentry
 */
exports.dumpTimeEntry = function(req, res) {
    TimeEntry.find(function(err, timeentries) {

        fs.stat('./dump', function(err, stats) {
            if (err) {
                fs.mkdirSync('./dump');
            }
            var dumpFile = './dump/timeentry_' + moment().format('YYYY-MM-DD_HHmmss') + '.json';
            fs.writeFileSync(dumpFile, timeentries)
            console.log('saved ' + timeentries.length + ' items');
            if (res) {
                res.send({
                    size: timeentries.length,
                    filename: dumpFile
                });
            }
        });
    });
};

/*
 * function to backup  all TimeEntries into a backup table
 *
 * curl -X POST http://localhost:30000/admin/backup/timeentry
 */
exports.backupTimeEntry = function(req, res) {
    TimeEntryBackup.remove({}, function(err) {
        if (!err) {
            console.log("TimeEntryBackup deleted");

            TimeEntry.find(function(err, timeentries) {
                timeentries.forEach(function(timeentry) {
                    new TimeEntryBackup({
                        _id: timeentry._id,
                        entry_date: timeentry.entry_date,
                        direction: timeentry.direction,
                        last_changed: timeentry.last_changed,
                        longitude: timeentry.longitude,
                        latitude: timeentry.latitude
                    }).save(function(err, timeentrybackup) {
                        if (err) {
                            console.log(err);
                        }
                    });
                });
                if (res) {
                    res.send({
                        'response': timeentries.length
                    });
                }
            });
        }
    });
    //res.send({'response':'backup done'});     
};

/*
 * ping functionality - resonses a pong ;-)
 *
 * curl -X GET http://localhost:30000/ping
 */
exports.ping = function(req, res) {
    res.send({
        'response': 'pong'
    });
};

/*
 * test and experiment endpoint
 *
 * curl -X GET http://localhost:30000/test
 */
exports.test = function(req, res) {
    var lastTimeentry;
    var count = 0;
    TimeEntry.find().sort({
        entry_date: 1
    }).exec(function(err, timeentries) {
        timeentries.forEach(function(timeentry) {
            if (lastTimeentry !== undefined) {
                if (moment(timeentry.entry_date).diff(lastTimeentry.entry_date) == 0 &&
                    timeentry.direction == lastTimeentry.direction) {
                    //timeentry.remove();
                    count++;
                    console.log("removing timeentry " + timeentry);
                } else {
                    lastTimeentry = timeentry;
                }
            } else {
                lastTimeentry = timeentry;
            }
        });

        res.send({
            'count_removed_doubletts': count
        });
    });
};
