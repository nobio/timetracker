const moment = require('moment');

const mongoose = require('mongoose');

const StatsDay = mongoose.model('StatsDay');


/* function of reduce */
function add(a, b) {
  // console.log("a=" + a + ", b=" + b);
  return a + b;
}

function varianz(a, curr, idx, array) {
  if (idx == array.length - 1) {
    const mean = (a + curr) / array.length;
    let tmp = 0;
    array.forEach((val) => {
      tmp += (val - mean) * (val - mean);
    });
    return Math.sqrt(tmp / array.length);
  }

  return a + curr;
}

function renderOneData(data, weekday) {
  // TODO: variance!!!!
  const avg = data.duration / data.count;
  return {
    x: weekday,
    y: Math.round(avg / 60 / 60 / 1000 * 100) / 100, // rounding 2 digits after comma
  };
}

exports.getStatsByTimeBox = timeUnit => new Promise((resolve, reject) => {
  let data;

  StatsDay.find().sort({ date: 1 }).exec((err, stats) => {
    if (err) {
      reject(err);
    } else {

      if (timeUnit === 'month') {
        data = getStatsByTimeBoxTimeUnit(stats, 'gggg-MM');
      } else if (timeUnit === 'week') {
        data = getStatsByTimeBoxTimeUnit(stats, 'gggg-ww');
      } else if (timeUnit === 'year') {
        data = getStatsByTimeBoxTimeUnit(stats, 'gggg');
      } else if (timeUnit === 'day') {
        data = getStatsByTimeBoxDay(stats);
      } else if (timeUnit === 'weekday') {
        data = getStatsByTimeBoxTimeWeekDay(stats);
      } else {
        reject(new Error(`time unit '${timeUnit}' is invalid`));
      }

      resolve({
        actual_working_time: 0,
        planned_working_time: 0,
        average_working_time: 1,
        inner_data: data,
        inner_comp: {},
      });
    }
  });
});


/**
 * calculates the timeboxed stats for a time unit given by a format
 * @param {*} stats
 * @param {*} timeUnitFormatString 'gggg-MM', 'ggg-ww', 'gggg'
 */
function getStatsByTimeBoxTimeUnit(stats, timeUnitFormatString) {

  const data = [{
    0: 0,
  }];
  let time_unit_stats = [];
  //console.log(time_unit_stats.reduce(add, 0));

  let lastTimeUnit = moment(stats[0].date).format(timeUnitFormatString);
  let actualTimeUnit;
  let idx = 0;
  let lastHash = stats[stats.length - 1]._id;

  stats.forEach((stat) => {
    actualTimeUnit = moment(stat.date).format(timeUnitFormatString);
    //console.log(actualTimeUnit)

    if (lastTimeUnit != actualTimeUnit || lastHash === stat._id) {
      const sum = time_unit_stats.reduce(add, 0); // reduce function
      const avg = sum / time_unit_stats.length;
      // var variance = time_unit_stats.reduce(varianz, 0);
      // console.log(moment(stat.date).format('YYYY-MM-DD') + " / " + moment(avg).format('hh:mm:ss') + "(" + Math.round(avg / 60 / 60 / 1000 * 100) / 100 + ")" + " / " + moment(sum).format('YYYY-MM-DD'));
      data[idx] = {
        x: moment(lastTimeUnit).format('YYYY-MM-DD'),
        y: Math.round(avg / 60 / 60 / 1000 * 100) / 100, // rounding 2 digits after comma
      };
      
      // reset to next week
      lastTimeUnit = actualTimeUnit;
      time_unit_stats = [];
      idx++;
    }
    time_unit_stats.push(stat.actual_working_time);
  });
  return data;
}

/**
 * calculates the timeboxed value for day
 * @param {*} stats
 */
function getStatsByTimeBoxDay(stats) {
  const data = [{
    0: 0,
  }];

  let idx = 0;
  stats.forEach((stat) => {
    data[idx] = {
      x: moment(stat.date).format('YYYY-MM-DD'),
      y: Math.round(stat.actual_working_time / 60 / 60 / 1000 * 100) / 100, // rounding 2 digits after comma
    };
    idx++;
  });
  return data;
}

/**
 * calculates the timboxed stats by week day
 * @param {*} stats
 */
function getStatsByTimeBoxTimeWeekDay(stats) {
  const data = [{
    0: 0,
  }];
  const time_data = {
    Mo: {
      duration: 0,
      count: 0,
    },
    Tu: {
      duration: 0,
      count: 0,
    },
    We: {
      duration: 0,
      count: 0,
    },
    Th: {
      duration: 0,
      count: 0,
    },
    Fr: {
      duration: 0,
      count: 0,
    },
    Sa: {
      duration: 0,
      count: 0,
    },
    Su: {
      duration: 0,
      count: 0,
    },
  };

  stats.forEach((stat) => {
    const timeUnit = moment(stat.date).format('dd');
    time_data[timeUnit].duration += stat.actual_working_time;
    time_data[timeUnit].count += 1;
  });

  // calculate statistics of last week
  data[0] = renderOneData(time_data.Mo, 'Mo');
  data[1] = renderOneData(time_data.Tu, 'Tu');
  data[2] = renderOneData(time_data.We, 'We');
  data[3] = renderOneData(time_data.Th, 'Th');
  data[4] = renderOneData(time_data.Fr, 'Fr');
  data[5] = renderOneData(time_data.Sa, 'Sa');
  data[6] = renderOneData(time_data.Su, 'Su');

  return data;
}
