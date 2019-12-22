require("../../db");
const g_util = require("../global_util");

const utilEntry = require("../entries/util-entries");
const mongoose = require("mongoose");

const StatsDay = mongoose.model("StatsDay");
const FailureDay = mongoose.model("FailureDay");
const moment = require("moment");

const DEFAULT_WORKING_TIME = 7.8 * 60 * 60 * 1000; // 7.8 hours in milli seconds

/**
 * Orchestrate the calculation of statistics
 */
exports.calcStats = () => {
  let firstEntry;
  let deletedDoublets;

  return new Promise((resolve, reject) => {
    utilEntry
      .removeDoublets()
      .then(removed => (deletedDoublets = removed.removed))
      .then(doubs => this.deleteAllStatsDays())
      .then(result => utilEntry.getFirstTimeEntry())
      .then(firstTimeEntry => (firstEntry = firstTimeEntry))
      .then(firstTimeEntry => utilEntry.getLastTimeEntry())
      .then(lastEntry => this.calculateStatistics(firstEntry, lastEntry))
      .then(result => resolve(result))
      .then(g_util.sendMessage("RECALCULATE"))
      .catch(err => reject(err));
  });
};

/**
 * This is the real calculation of statistice. The method searches the first entry point and
 * iterates day by day until the last time entry and calculates for each day the statistics
 *
 * @param {*} firstEntry the first entry in database
 * @param {*} lastEntry  the last entry in database
 */
exports.calculateStatistics = (firstEntry, lastEntry) =>
  new Promise((resolve, reject) => {
    let date = utilEntry.stripdownToDateUTC(firstEntry.age);

    while (date <= moment(lastEntry.age)) {
      // console.log(`calculating for day ${date.format('YYYY-MM-DD')}`);
      const dt = moment(date);
      this.getBusytimeByDate(dt)
        .then(busytime => {
          // console.log(`-> ${dt.toISOString()} ${JSON.stringify(busytime)}`)
          if (busytime && busytime.busytime != 0) {
            new StatsDay({
              date: dt,
              actual_working_time: busytime.busytime / 1,
              planned_working_time: DEFAULT_WORKING_TIME,
              is_working_day: true,
              is_complete: true,
              last_changed: new Date()
            }).save(err => {
              if (err) {
                reject(err);
              }
            });
          }
        })
        .catch(err => console.log(err));
      date = date.add(1, "day");
      // console.log(`> ${date}`);
    }
    resolve({
      firstEntry,
      lastEntry
    });
  });

exports.evaluateStats = () =>
  new Promise((resolve, reject) => {
    let firstEntry;
    let lastEntry;

    utilEntry
      .getFirstTimeEntry()
      .then(firstTimeEntry => (firstEntry = firstTimeEntry))
      .then(firstTimeEntry => utilEntry.getLastTimeEntry())
      .then(lastTimeEntry => (lastEntry = lastTimeEntry))
      .then(result => FailureDay.deleteMany())
      .then(result => this.storeValidationErrors(firstEntry, lastEntry))
      .then(result => resolve(result))
      .catch(err => reject(err));
  });

/**
 * Calculates the time of "busyness" for the given day;
 * must start with an 'enter' and must end with a 'go'. If only two entries (enter-go) a default value (midday break)
 * will be added (DEFAULT_BREAK_TIME);
 * if there are enter-go-enter-go(-enter-go....enter-go) entries the time span between two enter and go will be calculated and added.
 *
 * @param {*} dt calculate the busytime for given date
 */
exports.getBusytimeByDate = dt =>
  new Promise((resolve, reject) => {
    // console.log(`getBusytimeByDate: ${dt}`);
    // first get all entries for this day....
    utilEntry
      .getAllByDate(dt)
      .then(timeentries => {
        let busytime = 0;
        for (let n = timeentries.length - 1; n > 0; n -= 2) {
          // this must be a go-event
          if (timeentries[n].direction !== "go") {
            reject(
              new Error(
                `Die Reihenfolge der Kommen/Gehen-Einträge am ${dt.format(
                  "DD.MM.YYYY"
                )} scheint nicht zu stimmen.`
              ),
              0
            );
            return;
          }

          const end = timeentries[n].entry_date;
          const start = timeentries[n - 1].entry_date;

          busytime += end - start;
          // console.log(`${dt}: ${start} -> ${end}    = ${busytime} (${busytime / 1000 / 60 / 60})`);
        }
        // when ther have been only 2 entries we reduce the busytime by 45 minutes (default pause)
        if (timeentries.length === 2) {
          busytime -= g_util.DEFAULT_BREAK_TIME_MILLISECONDS;
        }
        // console.log(`${dt} => ${busytime} ${busytime / 1000 / 60 / 60}`);

        resolve({ busytime });
      })
      .catch(err => reject(err));
  });

/**
 * clears the MongoDB collection for statistics
 */
exports.deleteAllStatsDays = () =>
  new Promise((resolve, reject) => {
    let size;
    StatsDay.find((err, statsdays) => {
      size = statsdays.length;
      statsdays.forEach(statsday => {
        // console.log('removing ' + statsday);
        statsday.remove();
      });
      console.log(`deleted ${size} items`);
      resolve({ size });
    });
  });

exports.getStats = (timeUnit, dtStart, accumulate) => {
  // console.log("timeUnit=" + timeUnit + ", dtStart=" + dtStart+ ", accumulate=" + accumulate);

  var dtStart = moment.unix(dtStart / 1000);
  let dtEnd;

  if (timeUnit === "year") {
    dtEnd = moment(dtStart).add(1, "years");
  } else if (timeUnit === "month") {
    dtEnd = moment(dtStart).add(1, "months");
  } else if (timeUnit === "week") {
    dtEnd = moment(dtStart).add(1, "weeks");
  } else if (timeUnit === "day") {
    dtEnd = moment(dtStart).add(1, "days");
  }

  // console.log("Start at " + dtStart.toDate() + "\nEnd at " + dtEnd.toDate());

  return new Promise((resolve, reject) => {
    this.getStatsByRange(dtStart, dtEnd, accumulate).then(
      calculatedBusyTime => {
        // console.log(JSON.stringify(calculatedBusyTime));
        const chart_data = {
          xScale: timeUnit === "day" ? "ordinal" : "time",
          yScale: "linear",
          type: timeUnit === "day" ? "bar" : "line-dotted",
          main: [
            {
              data: calculatedBusyTime.inner_data
            }
          ],
          comp: [
            {
              type: "line",
              data: calculatedBusyTime.inner_comp
            }
          ]
        };
        resolve({
          actual_working_time: calculatedBusyTime.actual_working_time,
          planned_working_time: calculatedBusyTime.planned_working_time,
          average_working_time: calculatedBusyTime.average_working_time,
          chart_data
        });
      }
    );
  });
};

/**
 * returns the aggregated statistics for a given time range defined by start and end
 *
 * @param {*} dtStart
 * @param {*} dtEnd
 * @param {*} accumulate
 */
exports.getStatsByRange = (dtStart, dtEnd, accumulate) =>
  // console.log(">>> searching data for date between " + moment(dtStart).format('YYYY-MM-DD') + " and " + moment(dtEnd).format('YYYY-MM-DD'));
  // console.log(">>> searching data for date between " + dtStart + " and " + dtEnd);
  new Promise((resolve, reject) => {
    StatsDay.find({
      date: {
        $gte: dtStart,
        $lt: dtEnd
      }
    })
      .sort({
        date: 1
      })
      .exec((err, stats) => {
        if (err != undefined) {
          reject(err);
          return;
        }
        const innerData = [
          {
            0: 0
          }
        ];
        const innerComp = [
          {
            0: 0
          }
        ];
        let idx = 0;
        let actual_working_time = -1;
        let planned_working_time = -1;
        let average_working_time = -1;

        // calculating actual working time
        stats.forEach(stat => {
          actual_working_time += stat.actual_working_time;
        });
        average_working_time =
          actual_working_time / stats.length / 60 / 60 / 1000;

        // console.log("average_working_time = " + average_working_time);
        // console.log("length = " + stats.length);

        let sumActual = 0;
        let sumNominal = 0;
        stats.forEach(stat => {
          // console.log(" >>>>   " + stat.actual_working_time + " " + stat.planned_working_time + " -> " + stat._id);
          // actual_working_time += stat.actual_working_time;
          planned_working_time += stat.planned_working_time;
          if (accumulate === "true") {
            (sumActual +=
              Math.round((stat.actual_working_time / 60 / 60 / 1000) * 100) /
              100), // rounding 2 digits after comma
              (sumNominal += Math.round(average_working_time * 100) / 100), // rounding 2 digits after comma
              (innerData[idx] = {
                x: moment(stat.date).format("YYYY-MM-DD"),
                y: sumActual
              });
            innerComp[idx] = {
              x: moment(stat.date).format("YYYY-MM-DD"),
              y: sumNominal
            };
          } else {
            innerData[idx] = {
              x: moment(stat.date).format("YYYY-MM-DD"),
              y:
                Math.round((stat.actual_working_time / 60 / 60 / 1000) * 100) /
                100 // rounding 2 digits after comma
            };
            innerComp[idx] = {
              x: moment(stat.date).format("YYYY-MM-DD"),
              y: Math.round(average_working_time * 100) / 100 // rounding 2 digits after comma
            };
          }
          idx++;
        });

        resolve({
          actual_working_time,
          planned_working_time,
          average_working_time,
          inner_data: innerData,
          inner_comp: innerComp
        });
      });
  });

exports.storeValidationErrors = (firstEntry, lastEntry) =>
  new Promise((resolve, reject) => {
    // console.log(JSON.stringify(firstEntry), lastEntry);
    const lastEntriesAge = moment(lastEntry.age);
    const date = utilEntry.stripdownToDateUTC(firstEntry.age);
    console.log(date);
    for (let d = date; d < moment(lastEntry.age); date.add(1, "day")) {
      // console.log(`calculating for day ${date.format('YYYY-MM-DD')}`);
      const dt = moment(date);

      utilEntry.getAllByDate(dt).then(timeentries => {
        // firstly evaluate the not (yet) complete entries and save them....
        if (timeentries.length % 2 !== 0) {
          new FailureDay({
            date: dt,
            failure_type: "INCOMPLETE"
          }).save(err => {
            if (err) {
              reject(err);
            }
          });
        }

        // sencondly evaluate on wrong order of entries and save them too
        for (let n = timeentries.length - 1; n > 0; n -= 2) {
          // this must be a go-event
          if (timeentries[n].direction !== "go") {
            new FailureDay({
              date: dt,
              failure_type: "WRONG_ORDER"
            }).save(err => {
              if (err) {
                reject(err);
              }
            });
          }
        }
      });
    }
    resolve("calculation ongoing in background");
  });

  /**
   * read all failure dates from database; delivers an array like
   * 
   * [
   *     {
   *       "failure-type" : "INCOMPLETE",
   *       "failure-date" : "2019-11-24T00:00:00.000Z"
   *    },
   *    {
   *       "failure-type" : "INCOMPLETE",
   *       "failure-date" : "2019-12-12T00:00:00.000Z"
   *    }
   * ]
   */
  exports.getAllFailureDates = () => new Promise((resolve, reject) => {
    FailureDay.find().sort({ failure_type: 1, date: 1 })
      .then(failureDates => {
        const fDates =[];
        for(let n=0; n<failureDates.length; n++) {
          fDates.push(
          {
            'failure-date': failureDates[n].date, 
            'failure-type': failureDates[n].failure_type
          });
        }
        resolve(fDates);
      })
      .catch(err => reject(err));
  });
  
  
