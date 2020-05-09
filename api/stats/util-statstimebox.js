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

/**
 * Examples:
 * data: {
      duration: 0,
      count: 0,
      average: 0,
      rawData: [],
    }
    weekDay: 'Mo'
 */
function renderOneData(data, weekDay) {
  // calculate duration (=sum over all workingTimes) and count
  const tmpData = data.rawData.reduce(({ count, sum }, workingTime) => ({
    count: count + 1,
    sum: sum + workingTime,
  }), { count: 0, sum: 0 });

  // calculate the average working time for this week day
  tmpData.avg = tmpData.sum / tmpData.count;

  // map to an array with quadratic distances from average
  const distances = data.rawData.map(x => (Math.pow((x - tmpData.avg), 2)));
  tmpData.deviation = Math.sqrt(distances.reduce((v, d) => v + d) / tmpData.count); // varianz = sum of qudaratic distances / count; deviation = sqrt (varianz)

  // console.log(JSON.stringify(tmpData));

  return {
    x: weekDay,
    y: Math.round(tmpData.avg / 60 / 60 / 1000 * 100) / 100, // rounding 2 digits after comma
    n: tmpData.count,
    dev: Math.round(tmpData.deviation / 60 / 60 / 1000 * 100) / 100, // rounding 2 digits after comma
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
  if (stats === undefined || stats.length == 0) return data;

  // console.log(time_unit_stats.reduce(add, 0));

  let lastTimeUnit = moment(stats[0].date).format(timeUnitFormatString);
  let actualTimeUnit;
  let idx = 0;
  const lastHash = stats[stats.length - 1]._id;

  stats.forEach((stat) => {
    actualTimeUnit = moment(stat.date).format(timeUnitFormatString);
    // console.log(actualTimeUnit)

    if (lastTimeUnit != actualTimeUnit || lastHash === stat._id) {
      const sum = time_unit_stats.reduce(add, 0); // reduce function
      // const sum = time_unit_stats.reduce((total, value) => total + value);
      const avg = sum / time_unit_stats.length;
      // var variance = time_unit_stats.reduce(varianz, 0);
      // console.log(moment(stat.date).format('YYYY-MM-DD') + " / " + moment(avg).format('hh:mm:ss') + "(" + Math.round(avg / 60 / 60 / 1000 * 100) / 100 + ")" + " / " + moment(sum).format('YYYY-MM-DD') + " / " + lastTimeUnit + " / " + moment(lastTimeUnit).format('YYYY-MM-DD'));
      // special treatment for time unit 'year':
      //   The constructor does not take '2014' it needs to get '2014-01-01';
      if (timeUnitFormatString === 'gggg') {
        lastTimeUnit += '-01-01';
      }

      data[idx] = {
        x: lastTimeUnit,
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
      rawData: [],
    },
    Tu: {
      rawData: [],
    },
    We: {
      rawData: [],
    },
    Th: {
      rawData: [],
    },
    Fr: {
      rawData: [],
    },
    Sa: {
      rawData: [],
    },
    Su: {
      rawData: [],
    },
  };
  if (stats === undefined || stats.length == 0) return data;

  // prepare data array: sort all working times to the corresponding week day
  stats.forEach((stat) => {
    const timeUnit = moment.tz(stat.date, 'Europe/Berlin').format('dd');
    time_data[timeUnit].rawData.push(stat.actual_working_time);
  });

  // calculate statistics of last week
  data[0] = renderOneData(time_data.Mo, 'Mo');
  data[1] = renderOneData(time_data.Tu, 'Di');
  data[2] = renderOneData(time_data.We, 'Mi');
  data[3] = renderOneData(time_data.Th, 'Do');
  data[4] = renderOneData(time_data.Fr, 'Fr');
  // data[5] = renderOneData(time_data.Sa, 'Sa');
  // data[6] = renderOneData(time_data.Su, 'Su');

  return data;
}
