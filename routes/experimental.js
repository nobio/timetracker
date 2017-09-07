var mongoose = require('mongoose');
var moment = require('moment');
var TimeEntry = mongoose.model('TimeEntry');

/*
 * ping functionality - resonses a pong ;-)
 *
 * curl -X GET http://localhost:30000/ping
 */
exports.ping = (req, res) => {
    res.send({
        response: 'pong'
    });
};

/*
 * test and experiment endpoint
 *
 * curl -X GET http://localhost:30000/experiment
 */
exports.experiment = (req, res) => {
    var entriesFromDate = [];
    var firstDates = [];
    var actualDate;

    TimeEntry.find().sort({entry_date: 1})
    .catch(err => res.send(err))
    .then(timeentries => {
        timeentries.forEach(timeEntry => {
            var myDate = moment(timeEntry.entry_date).format('YYYY-MM-DD');
            if(!actualDate) {
                actualDate = myDate;
            }
            if(actualDate == myDate && timeEntry.direction == 'enter') {
                entriesFromDate.push(timeEntry);
            } else {
                firstDates.push(entriesFromDate.reduce((mapped, value) => {
                    var m = moment(mapped.entry_date).format('HH:mm');
                    var v = moment(value.entry_date).format('HH:mm');
                    //console.log(m + ' ' + v + ' -> ' + (m>v));  
                    if(m < v) {
                        return mapped;
                    } else {
                        return value;
                    }
                }));
                entriesFromDate = [];
                actualDate = undefined;
            }
            console.log(firstDates.length);
        });
        console.log(firstDates);
        res.send('Minimum:\n');
    });
};

/*
exports.test = (req, res) => {
    TimeEntry.find().sort({entry_date: 1})
    .catch(err => res.send(err))
    .then(timeentries => {
        var mini = timeentries.reduce((mapped, value) => {
            var m = moment(mapped.entry_date).format('HH:mm');
            var v = moment(value.entry_date).format('HH:mm');
            //console.log(m + ' ' + v + ' -> ' + (m>v));  
            if(m < v) {
                return mapped;
            } else {
                return value;
            }
        });
        res.send('Minimum: ' + moment(mini.entry_date).format('HH:mm')  + '\n');
    });
};
*/