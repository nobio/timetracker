
var mongoose = require('mongoose');
var moment = require('moment');
var timzone = require('moment-timezone');
var TimeEntry  = mongoose.model('TimeEntry');

/* ================================================================== */
/* =========================== JADE/HTML ============================ */
/* ================================================================== */

/*
 * calculates the number of entries and renders the index.jade by passing the size
 */
exports.index = function(req, res) {
    getNumberOfTimeEntries(function(err, size) {
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
    
    validateRequest(direction, datetime, function(err) {
        
        if(err) {
            console.log('exports.entry received an error: ' + err);
            res.send(500, 'Error while saving new Time Entry: ' + err.message);
        } else {
            new TimeEntry({
            entry_date: datetime,
            direction: direction,
            isWorkingDay: false
            }).save(function(err, timeentry) {
                // and now add the size to the monggose-JSON (needs to be converted to an object first)
                var t = timeentry.toObject();
                getNumberOfTimeEntries(function(err, size) {
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
    var dt = moment.unix(req.params.date/1000);
    dt.millisecond(0);
    dt.second(0);
    dt.minutes(0);
    dt.hours(0);
    
    getTimeEntriesByDate(dt, function(err, timeentries) {
        
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
            res.send(500, 'Error while reading Time Entry: ' + id + " " + err.message);
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

/* ================================================================== */
/* ======================== INTERNAL METHODS ======================== */
/* ================================================================== */

/*
 * loads the TimeEntries from the given day and checking, denpending on direction,
 *   when direction == "enter" -> the last entry of this given day must either not exist or be "go"; otherwise -> error
 *   when direction == "go"    -> the last entry of this given day must be "enter"; if no entry exists or the last was "go" -> error
 *   dt is expected in ISO format
 */
function validateRequest(direction, dt, callback) {
    
    getLastTimeEntryByDate(dt, function(err, entry) {
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
function getLastTimeEntryByDate(dt, callback) {
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

/*
 * reads all time entries for a given date
 */
function getTimeEntriesByDate(dt, callback) {
    
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
function getNumberOfTimeEntries(callback) {
    
    TimeEntry.find(function(err, timeentries) {
        if(err) {
            callback(err);
        } else {
            callback(err, timeentries.length);
        }
    })
}


