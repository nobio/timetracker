
var mongoose = require('mongoose');
var moment = require('moment');
var timzone = require('moment-timezone');
var util = require('./util');
var TimeEntry  = mongoose.model('TimeEntry');

/* ================================================================== */
/* =========================== JADE/HTML ============================ */
/* ================================================================== */

/*
 * calculates the number of entries and renders the index.jade by passing the size
 */
exports.index = function(req, res) {
    util.getNumberOfTimeEntries(function(err, size) {
        console.log(size);
        res.render('index', {
        size: size
        });
    });
};

exports.admin = function(req, res) {
    res.render('admin');
}

exports.advanced = function(req, res) {
    res.render('advanced');
}

exports.stats = function(req, res) {
    res.render('stats');
}

/* ================================================================== */
/* ============================== REST ============================== */
/* ================================================================== */

/*
 * creates a new TimeEntry; the date is "now" and the direction needs to be given
 */
exports.entry = function(req, res) {
    var direction = req.body.direction;
    var datetime = req.body.datetime;
    
    console.log(datetime);
    
    util.validateRequest(direction, datetime, function(err) {
        
        if(err) {
            console.log('exports.entry received an error: ' + err);
            res.send(500, 'Error while saving new Time Entry: ' + err.message);
        } else {
            new TimeEntry({
            entry_date: datetime,
            direction: direction
            }).save(function(err, timeentry) {
                // and now add the size to the monggose-JSON (needs to be converted to an object first)
                var t = timeentry.toObject();
                util.getNumberOfTimeEntries(function(err, size) {
                    t.size = size;
                    
                    if(err) {
                        res.send(500, 'Error while saving new Time Entry: ' + err.message);
                    } else {
                        res.send(t);
                    }
                });
                
            });
        }
    });
}

/*
 * deletes one time entry by it's id
 */
exports.delete = function(req, res) {
    var id = req.params.id;
    
    TimeEntry.findByIdAndRemove(id, function(err) {
        if(err) {
            res.send(500, 'Error while deleting Time Entry: ' + id + " " + err.message);
        } else {
            res.send(id);
        }
    });
}

/*
 * lists all Time Entries for a given date (this particular day)
 */
exports.getAllByDate = function(req, res) {
    /*
     console.log('getAllByDate received date (raw)    : ' + req.params.date);
     console.log('getAllByDate received date (paresed): ' + moment(req.params.date/1).format('DD.MM.YYYY HH:mm:ss'));
     console.log('getAllByDate received date (Berlin):  ' + moment.tz(req.params.date/1, 'Europe/Berlin').format('DD.MM.YYYY HH:mm:ss'));
     console.log('getAllByDate received date (Toronto): ' + moment.tz(req.params.date/1, 'America/Toronto').format('DD.MM.YYYY HH:mm:ss'));
     console.log('getAllByDate received date (Berlin):  ' + moment.tz(req.params.date, 'Europe/Berlin').format('DD.MM.YYYY HH:mm:ss'));
     console.log('getAllByDate received date (Toronto): ' + moment.tz(req.params.date, 'America/Toronto').format('DD.MM.YYYY HH:mm:ss'));
     */
    var dt = util.stripdownToDate(moment.unix(req.params.date/1000));
    console.log('getAllByDate received date: ' + moment(dt).format('DD.MM.YYYY HH:mm:ss'));
    
    util.getTimeEntriesByDate(dt, function(err, timeentries) {
        
        if(err) {
            res.send(500, 'Error while loading Time Entries: ' + err.message);
        } else {
            res.send(timeentries);
        }
        
    });
}

/*
 * get one Time Entry by it's id
 */
exports.getEntryById = function(req, res) {
    
    TimeEntry.findById(req.params.id, function(err, timeentry) {
        if(err) {
            res.send(500, 'Error while reading Time Entry: ' + id + " " + err);
        } else {
            res.send(timeentry);
        }
    });
    
}

/*
 * stores one Time Entry
 */
exports.storeEntryById = function(req, res) {
    
    res.send(null);
    
}

/*
 * Reads the busy time of all entries for a given day
 */
exports.getBusyTime = function(req, res) {
    var dt = util.stripdownToDate(moment.unix(req.params.date/1000));
    
    util.getBusytimeByDate(dt, function(err, d, busytime) {
        if(err) {
            res.send(500, 'Error while reading Time Entries for day: ' + dt.format('DD.MM.YYYY'));
        } else {
            res.send(moment.duration(busytime));
        }
    });
}



