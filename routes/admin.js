var mongoose = require('mongoose');
var moment = require('moment');
var timzone = require('moment-timezone');
var util = require('./util');

var TimeEntry  = mongoose.model('TimeEntry');
var StatsDay = mongoose.model('StatsDay');


/*
 <?xml version="1.0" encoding="utf-8"?>
 <holidays country="Germany" state="Bayern" year="2012">
 <holiday title="Neujahr" timestamp="1325372400" date="2012/01/01" />
 <holiday title="Heilige Drei Könige" timestamp="1325804400" date="2012/01/06" />
 <holiday title="Karfreitag" timestamp="1333663200" date="2012/04/06" />
 <holiday title="Ostermontag" timestamp="1333922400" date="2012/04/09" />
 <holiday title="Maifeiertag" timestamp="1335823200" date="2012/05/01" />
 <holiday title="Christi Himmelfahrt" timestamp="1337205600" date="2012/05/17" />
 <holiday title="Pfingstmontag" timestamp="1338156000" date="2012/05/28" />
 <holiday title="Fronleichnam" timestamp="1339020000" date="2012/06/07" />
 <holiday title="Mariä Himmelfahrt" timestamp="1344981600" date="2012/08/15" />
 <holiday title="Tag der Deutschen Einheit" timestamp="1349215200" date="2012/10/03" />
 <holiday title="Allerheiligen" timestamp="1351724400" date="2012/11/01" />
 <holiday title="1. Weihnachtstag" timestamp="1356390000" date="2012/12/25" />
 <holiday title="2. Weihnachtstag" timestamp="1356476400" date="2012/12/26" />
 </holidays>
 var isWeekend = yourDateObject.getDay()%6==0;
 */







/*
 * deletes all TimeEntry-items from database. This should only be used during development time
 * and later either deleted or put behind some special user privileges
 */
exports.deleteAll = function(req, res) {
    var size;
    TimeEntry.find(function(err, timeentries) {
        size = timeentries.length;
        timeentries.forEach(function(timeentry) {
            console.log(timeentry);
            timeentry.remove();
        });
        console.log('deleted ' + size + ' items');
        res.send({ size: size });
    });
}


/*
 * calculates the statistics for today +/- one month
 *
 * curl -X PUT http://localhost:30000/stats
 */
exports.calcStats = function(req, res) {
    res.send(null);
}

/*
 * fills the Stats schema with holidays and weekends
 *
 * curl -X PUT http://localhost:30000/admin/holidays
 */
exports.setHolidays = function (req, res) {
    res.send(null);
}

/*
 * marks/unmarks a day as holiday
 *
 * curl -X PUT http://localhost:30000/admin/holiday
 */
exports.setHoliday = function (req, res) {
    var holiday = req.body.holiday;
    var date = util.stripdownToDate(moment(req.body.date, 'DD.MM.YYYY').tz("Europe/Berlin"));
    
    
	console.log('date: ' + date + ', holiday: ' + holiday);
    
    StatsDay.find({date: date}, function(err, stats) {
    	if(err) {
        	console.log(err);
	        res.send(500, 'Error while loading new day statistics: ' + err.message);
        } else {
            
            if(util.isEmpty(stats)) {
                stats = new StatsDay({
                date: date
                    , actual_working_time: 0
                    , planned_working_time: 0
                    , is_working_day: holiday
                    , is_complete: true
                });
                
                console.log("I'm saving now this " + stats)
                stats.save(function(err, stat, numberAffected) {
                    if(err) {
                        console.log(err);
                        res.send(500, 'Error while saving new day statistics: ' + err.message);
                    }
                });
                
            } else {
                var planned_working_time = (holiday === 'true' ? 0 : 7.8);
                console.log("I'm updating record now; planned time : " + planned_working_time);
                if(stats.length === 0 || stats.length > 1) {
                        res.send(500, 'somethings corrupt with your StatsDay data. I received ' + stats.length + ' entries for ' + date + ' instead of 1 entry');                    
                }
                StatsDay.update(
                                {_id: stats[0]._id},
                                {$set:{is_working_day: holiday, planned_working_time: planned_working_time}},
                                {upsert:true},
                                function (err, numberAffected, raw) {
                                    console.log(numberAffected);
                                    console.log(raw);
                                    if(err) {
                                        console.log(err);
                                        res.send(500, 'Error while saving new day statistics: ' + err.message);
                                    }
                                });
            }
        }
    });
    
}


/*
 * creates random Time Entries; supposed to be used after cleaning the TimeEntry table
 *
 * curl -X PUT http://localhost:30000/admin/rnd_entries
 */
exports.setRandomTimeEntries = function (req, res) {
    
 	var DAY_IN_SECS = 60*60*24;
 	var now = moment().unix();
    var today = now - (now % DAY_IN_SECS);
    
    console.log(today);
    
    for(var t=today - 18*DAY_IN_SECS; t<today +180*DAY_IN_SECS; t+=DAY_IN_SECS) {
        
        var dt = moment(t);
        console.log(t + ': ' + dt.format('DD.MM.YYYY HH:mm:ss'));
        
        var countEntries = 1 + Math.floor(Math.random() * 3);
    	console.log("Anzahl Eiträge: " + countEntries * 2);
        
        var pointer = t + 60*60*5; // 5 hours offset per day
        for(var i=0; i<countEntries; i++) {
 			var varianz = Math.floor(Math.random() * 60*60*4); // random range +/- 60 min
        	var start = pointer + varianz - 60*60;
            
 			varianz += Math.floor(Math.random() * 60*60*4); // random range +/- 30 min
            var end = start + varianz -60*60;
            
            console.log("Start: " + moment(1000*start).format('DD.MM.YYYY HH:mm:ss') + " - End: " + moment(1000*end).format('DD.MM.YYYY HH:mm:ss'));
            pointer = end + 61*60;
            
            new TimeEntry({
            entry_date: moment(1000 * start),
            direction: 'enter',
            isWorkingDay: false
            }).save(function(err, timeentry) {
            	if(err) {
                	console.log(err);
                }
            });
            
            new TimeEntry({
            entry_date: moment(1000 * end),
            direction: 'go',
            isWorkingDay: false
            }).save(function(err, timeentry) {
            	if(err) {
                	console.log(err);
                }
            });
        }
    }
    
	res.send({now:today});
}
