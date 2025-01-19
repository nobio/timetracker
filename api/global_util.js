/* eslint-disable max-len */
/* eslint-disable no-lonely-if */
const Axios = require('axios');
const moment = require('moment');
const toggleUtil = require('./admin/util-toggles');
require('moment-timezone');

const DEFAULT_BREAK_TIME_SECONDS = 60 * 45; // 45 min Pause
const AOK_BREAK_TIME_SECONDS = 30 * 60; // 30 min Pause
const AOK_WEGEZEIT_SECONDS = 504 * 60; // 0.14 Stunden = 60*0.14=8.4 Minuten = 8.4*60=504 Sekunden
const AOK_MAX_WORKTIME_SECONDS = 10 * 60 * 60 * 1000; // max 10 h Arbeit pro Tag
const BAADERBANK_BREAK_TIME_SECONDS_30_MIN = 30 * 60; // 30 min Pause
const BAADERBANK_BREAK_TIME_SECONDS_45_MIN = 45 * 60; // 30 min Pause
const BAADERBANK_6_HOURS = 6 * 60 * 60 * 1000; // 6 h Arbeit pro Tag in ms
const BAADERBANK_9_HOURS = 9 * 60 * 60 * 1000; // 9 h Arbeit pro Tag in ms
exports.MODEL_TYPES = ['User', 'Toggle', 'Properties', 'GeoFence', 'FailureDay', 'StatsDay', 'TimeEntry', 'GeoTracking'];

/**
 * calculates the break time dependeing on the date (needed to use the right employer) and
 * the numbers of entries per day
 */
exports.getBreakTimeSeconds = (date, workDurationInHours = 8) => {
  const workDurationInMS = workDurationInHours * 60 * 60 * 1000;
  // console.log(date, moment(date, 'X'));
  // const dateMoment = moment(date * 1000, 'x');  // format 'x' is 'Unix ms timestamp'
  const dateMoment = moment(date, 'X'); // format 'X' is 'Unix timestamp'
  // console.log(`date ${dateMoment.format('DD.MM.YYYY')} is after 31.08.2021 (AOK): ${dateMoment.isAfter('2021-08-31')} work: ${workDurationInMS / 1000 / 3600}`);
  // console.log(`date ${dateMoment.format('DD.MM.YYYY')} is after 01.10.2023 (BAD): ${dateMoment.isAfter('2023-10-01')}`);
  // console.log(dateMoment.isAfter('2021-08-31')); console.log(dateMoment.isBefore('2023-10-01'));
  if (dateMoment.isAfter('2021-08-31') && dateMoment.isBefore('2023-10-01')) {
    // AOK Bayern
    return AOK_BREAK_TIME_SECONDS;
  } if (dateMoment.isAfter('2023-09-30')) {
    // Baader Bank
    if (workDurationInMS < BAADERBANK_6_HOURS) return 0;
    if (workDurationInMS >= BAADERBANK_6_HOURS && workDurationInMS <= BAADERBANK_9_HOURS) return BAADERBANK_BREAK_TIME_SECONDS_30_MIN;
    if (workDurationInMS > BAADERBANK_9_HOURS) return BAADERBANK_BREAK_TIME_SECONDS_45_MIN;
  }
  return DEFAULT_BREAK_TIME_SECONDS;
};
exports.getBreakTimeMilliSeconds = (date, workDurationInHours = 8) => this.getBreakTimeSeconds(date, workDurationInHours) * 1000;
exports.getBookedTimeMilliSeconds = (busytime, pause, date, entriesPerDay) => {
  // console.log(busytime, pause, date, entriesPerDay)
  let bookedTime;
  if (moment(date, 'X').isAfter('2021-08-31') && moment(date, 'X').isBefore('2023-09-30')) {
    // AOK Bayern
    if (entriesPerDay > 2) {
      bookedTime = busytime + AOK_WEGEZEIT_SECONDS; // 'Wegegeld'
    } else {
      bookedTime = busytime - pause + AOK_WEGEZEIT_SECONDS;
    }
    bookedTime = Math.min(bookedTime, AOK_MAX_WORKTIME_SECONDS);
  } else if (moment(date, 'X').isAfter('2023-09-30')) {
    // Baader Bank
    // TODO: IF busytime <= 6h und pause = 0 -> 30min Abzug
    // TODO: IF busytime > 6h und pause = 0 -> 45min Abzug
    bookedTime = Math.min(bookedTime, AOK_MAX_WORKTIME_SECONDS);
  } else {
    // vor/nach AOK Bayern
    if (entriesPerDay > 2) bookedTime = busytime; // more then 2 (i.e. 4, 6, etc.) entries, the pause has already been taken into account
    else if (busytime < pause) bookedTime = busytime; // pause > bookedTime: we are at the very morning shortly after checking in
    else bookedTime = busytime - pause; // remains: n==2 and bookedTime longer than calculated pause
  }

  return bookedTime;
};

const { SLACK_URL } = process.env;
/*
curl -X POST -H "Content-Type: application/json" -d '{"name":"CREATE_ENTRY", "toggle":true, "notification":"created new time entry"}' http://localhost:30000/api/toggles
curl -X POST -H "Content-Type: application/json" -d '{"name":"DELETE_ENTRY", "toggle":true, "notification":"delete time entry"}' http://localhost:30000/api/toggles
curl -X POST -H "Content-Type: application/json" -d '{"name":"BACKUP_DB", "toggle":true, "notification":"statistics have been backed up to database table"}' http://localhost:30000/api/toggles
curl -X POST -H "Content-Type: application/json" -d '{"name":"DUMP_FS", "toggle":true, "notification":"data has been dumped to file system"}' http://localhost:30000/api/toggles
curl -X POST -H "Content-Type: application/json" -d '{"name":"RECALCULATE", "toggle":true, "notification":"statistics have been calculated"}' http://localhost:30000/api/toggles
curl -X POST -H "Content-Type: application/json" -d '{"name":"SERVER_STARTED", "toggle":true, "notification":"timetracker server started up"}' http://localhost:30000/api/toggles
*/

/**
 * use Slack's 'incoming Webhooks' to publish messages
 */
exports.sendMessage = async (notificationKey, addedContent) => {
  const addedCtnt = (addedContent) || ''; // if addedContent is undefined set it with blank string
  console.log(`${notificationKey} (${addedCtnt})`);
  try {
    const toggle = await toggleUtil.getToggleByName(notificationKey);
    if (toggle != null && toggle.toggle === true) {
      // console.log(`toggle '${notificationKey}' switched on`);
      const msg = `(${moment.tz('Europe/Berlin').format('HH:mm:ss')}) *${toggle.notification}* ${addedCtnt}`;
      return this.sendTextMessage(msg);
    }
    return (`toggle ${notificationKey} switched off`);
  } catch (error) {
    return error.message;
  }
};

/**
 * just send any text to slack; please mind that it could be markd down formatted
 * @param {*} message
 * @returns
 */
exports.sendTextMessage = async (message) => {
  // if no SLACK_URL was found then lets just return the default slack response (test cases...)
  if (SLACK_URL) {
    try {
      return await Axios.post(`${SLACK_URL}`, {
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `${message}`,
            },
          },
        ],
      });
    } catch (error) {
      return `Error sending message to Slack: ${error.message}`;
    }
  }

  return (`could not send message <'${message}'> to SLACK (no slack url provided); logging to stderr instead`);
};
