
var mongoose = require('mongoose');
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

/* ================================================================== */
/* ============================== REST ============================== */
/* ================================================================== */

/*
 * creates a new TimeEntry; the date is "now" and the direction needs to be given
 */
exports.entry = function(req, res) {
    var direction = req.body.direction;
    
    validateRequest(direction, new Date, function(err) {
        
        if(err) {
            console.log('exports.entry received an error: ' + err);
            res.send(500, 'Error while saving new Time Entry: ' + err.message);
        } else {
            new TimeEntry({
            entry_date: new Date,
            direction: direction,
            isWorkingDay: false
            }).save(function(err, timeentry) {
                // and now add the size to the monggose-JSON (needs to be converted to an object first)
                var t = timeentry.toObject();
                getNumberOfTimeEntries(function(err, size) {
                    t.size = size;
                    
                    if(!err) {
                        res.send(t);
                    } else {
                        res.send(500, 'Error while saving new Time Entry: ' + err.message);
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

/* ================================================================== */
/* ======================== INTERNAL METHODS ======================== */
/* ================================================================== */

/*
 * loads the TimeEntries from the given day and checking, denpending on direction,
 *   when direction == "enter" -> the last entry of this given day must either not exist or be "go"; otherwise -> error
 *   when direction == "go"    -> the last entry of this given day must be "enter"; if no entry exists or the last was "go" -> error
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
 * reads all time entries for a given date
 */
function getLastTimeEntryByDate(dt, callback) {
    
    var dtStart = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
    var dtEnd = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()+1);
    
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
    })
    ;
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


