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


exports.getStats = (timeUnit, dtStart) => {
    //console.log(dtStart)
  
    var dtStart = moment.unix(dtStart / 1000);
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

    // console.log("Start at " + dtStart.toDate() + "\nEnd at " + dtEnd.toDate());

    return new Promise((resolve, reject) => {
        this.getStatsByRange(dtStart, dtEnd)
            .then(calculatedBusyTime => {
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
                resolve({
                    actual_working_time: calculatedBusyTime.actual_working_time,
                    planned_working_time: calculatedBusyTime.planned_working_time,
                    average_working_time: calculatedBusyTime.average_working_time,
                    chart_data: chart_data
                });
            })
    });
};

/*
 * returns the aggregated statistics for a given time range defined by start and end
 */
exports.getStatsByRange = (dtStart, dtEnd,) => {
    console.log(dtStart)
    //console.log(">>> searching data for date between " + moment(dtStart).format('YYYY-MM-DD') + " and " + moment(dtEnd).format('YYYY-MM-DD'));
    console.log(dtEnd)
    return new Promise((resolve, reject) => {
        StatsDay.find({
            date: {
                $gte: dtStart,
                $lt: dtEnd
            }
        }).sort({
            date: -1
        }).exec((err, stats) => {
            if(err != undefined) {
                reject(err);
                return
            }
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

            resolve({
                actual_working_time: actual_working_time,
                planned_working_time: planned_working_time,
                average_working_time: average_working_time,
                inner_data: innerData,
                inner_comp: innerComp
            });
        });
    })
};