require('../../db/db')

var mongoose = require('mongoose')
var TimeEntry = mongoose.model('TimeEntry')
var moment = require('moment')

/*
exports.calcStats
    removeDoulets
        deleteAllStatsDays
            getFirstTimeEntry
                getLastTimeEntry
                    getBusyTimeByDate
                        getAllByDate
*/

exports.calcStats = () => {
    this.removeDoublets()
    .then(doubs => deleteAllStatsDays())
}
  

exports.removeDoublets = () => {
    var lastTimeentry;
    var count = 0;

    return new Promise((resolve, reject) => {
        TimeEntry.find().sort({
            entry_date: 1
        })
        .then(timeEntries => {
            timeEntries.forEach((timeentry) => {
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
            resolve({'removed': count})
        })
        .catch(err => reject(err))
    });        

};

exports.deleteAllStatsDays = () => {
    var size;
    return new Promise((resolve, reject) => {
        StatsDay.find((err, statsdays) => {
            size = statsdays.length;
            statsdays.forEach((statsday) => {
                //console.log('removing ' + statsday);
                statsday.remove();
            });
            console.log('deleted ' + size + ' items');
            { size: size };
        });
    })
};

exports.getFirstTimeEntry = () => {
    return new Promise((resolve, reject) => {
        TimeEntry.aggregate([{
            $group: {
                _id: 0,
                age: {
                    $min: "$entry_date"
                }
            }
        }])
        .then(timeentries => {
            resolve(timeentries[0])
        })
        .catch(err => reject(new Error('Unable to read first Time Entry: ' + ' (' + err.message + ')')))
    });        
};

exports.getLastTimeEntry = () => {
    return new Promise((resolve, reject) => {
        TimeEntry.aggregate([{
            $group: {
                _id: 0,
                age: {
                    $max: "$entry_date"
                }
            }
        }])
        .then(timeentries => {
            resolve(timeentries[0])
        })
        .catch(err => reject(new Error('Unable to read last Time Entry: ' + ' (' + err.message + ')')))
    });        
};

exports.getBusytimeByDate = (dt, callback) => {
}    