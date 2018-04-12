require('../../db/db')

const mongoose = require('mongoose')
const TimeEntry = mongoose.model('TimeEntry')
const StatsDay = mongoose.model('StatsDay')
const moment = require('moment')

/*
exports.calcStats
    removeDoulets (ok)
        deleteAllStatsDays (ok)
            getFirstTimeEntry (ok)
                getLastTimeEntry (ok)
                    getBusyTimeByDate
                        getAllByDate
*/

exports.calcStats = () => {
    return new Promise((resolve, reject) => {
        this.removeDoublets()
        .then(doubs => this.deleteAllStatsDays())
        .then(deleted => resolve(deleted))
        .catch(err => reject(err))
    })
};
  

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
                    if (moment(timeentry.entry_date).diff(lastTimeentry.entry_date) < 1000 && // .diff -> milliseconds; < 1000 less than one second
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
            })
        })
        console.log(count + ' doublets removed');    
        resolve({'removed': count})
    })
    .catch(err => reject(err))
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
            resolve({ size: size });
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