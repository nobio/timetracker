var mongoose = require('mongoose');
var moment = require('moment');
var util = require('./util');
var TimeEntry = mongoose.model('TimeEntry');

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
			size : size
		});
	});
};

exports.admin = function(req, res) {
	res.render('admin');
}

exports.admin_item = function(req, res) {
	res.render('admin_item');
    // http://localhost:30000/admin_item?id=537edec991c647b10f4f5a6f
}

exports.stats = function(req, res) {
	res.render('stats');
}

exports.geoloc = function(req, res) {
	res.render('geoloc');
}

/* ================================================================== */
/* ============================== REST ============================== */
/* ================================================================== */

/*
 * creates a new TimeEntry; the date is "now" and the direction needs to be given
 */
exports.createEntry = function(req, res) {
	var direction = req.body.direction;
	var datetime = req.body.datetime;

	util.createTimeEntry(direction, datetime, function(err, timeentry) {
		if (err) {
			res.send(500, 'Error while creating new  Time Entry: ' + err.message);
		} else {
			res.send(timeentry);
		}		
	});
    
}
/*
 * deletes one time entry by it's id
 */
exports.delete = function(req, res) {
	var id = req.params.id;
    
	TimeEntry.findByIdAndRemove(id, function(err) {
		if (err) {
			res.send(500, 'Error while deleting Time Entry: ' + id + " " + err.message);
		} else {
			res.send(id);
		}
	});
}

/*
 * Reads all time entries
 *
 * curl -X GET http://localhost:30000/entry
 */
exports.getEntries = function(req, res) {
	TimeEntry.find(function(err, timeentries) {
		if (err) {
			res.send(500, 'Error while reading Time Entries: ' + id + " " + err);
		} else {
			res.send(timeentries);
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
	var dt = util.stripdownToDate(moment.unix(req.params.date / 1000));
	console.log('getAllByDate received date: ' + moment(dt).format('DD.MM.YYYY HH:mm:ss'));
    
	util.getTimeEntriesByDate(dt, function(err, timeentries) {
        
		if (err) {
			res.send(500, err);
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
		if (err) {
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
    console.log(req.params.id + ", " + req.body.direction + ", " + req.body.entry_date);
    
    TimeEntry.findById(req.params.id, function(err, timeentry) {
        console.log(err);
		if (err) {
			res.send(500, 'Error while reading Time Entry: ' + err);
		} else {
            timeentry.direction = req.body.direction;
            timeentry.entry_date = moment(req.body.entry_date);
            timeentry.last_changed = new Date();
            
            console.log(timeentry);
            
            timeentry.save(function(err) {
                if (err) {
                    res.send(500, 'Error while saving Time Entry: '  + err);
                } else {
                    res.send(timeentry);
                }
            });
		}
	});
    
}

/*
 * Reads the busy time of all entries for a given day
 *
 * curl -X GET http://localhost:30000/entries/busy/1393455600000
 */
exports.getBusyTime = function(req, res) {
	var dt = util.stripdownToDate(moment.unix(req.params.date / 1000));
    
	util.getBusytimeByDate(dt, function(err, d, busytime) {
		if (err) {
			res.send(500, err.toString());
		} else {
			res.send(moment.duration(busytime));
		}
	});
}

/*
 { 
    device: '0C799CAD-D148-4F05-94EA-A74086AA91E3',
    id: 'Work',
    latitude: '49.51429653451733',
    longitude: '10.87531216443598',
    timestamp: '1401728167.886038',
    trigger: 'exit' 
 }
 { 
    device: '0C799CAD-D148-4F05-94EA-A74086AA91E3',
    id: 'Work',
    latitude: '49.51429653451733',
    longitude: '10.87531216443598',
    timestamp: '1401729237.592610',
    trigger: 'enter' 
 }
 *
 */
exports.geofence = function(req, res) {
    console.log(req.body);
    var direction = (req.body.trigger == 'enter' ? 'enter' : 'go');
    if(req.body.id == 'Work') {
		util.createTimeEntry(direction, moment(), function(err, timeentry) {
			if (err) {
				res.send(500, 'Error while creating new  Time Entry: ' + err.message);
			} else {
				res.send(timeentry);
			}		
		});    			
    } 
    res.send(null);
}

