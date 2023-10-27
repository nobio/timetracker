const Axios = require('axios');
const moment = require('moment');
const toggleUtil = require('./admin/util-toggles');
require('moment-timezone');

const DEFAULT_BREAK_TIME_SECONDS = 60 * 45; // 45 min Pause
const AOK_BREAK_TIME_SECONDS = 30 * 60; // 30 min Pause
const AOK_WEGEZEIT_SECONDS = 504 * 60; // 0.14 Stunden = 60*0.14=8.4 Minuten = 8.4*60=504 Sekunden
const AOK_MAX_WORKTIME_SECONDS = 10 * 60 * 60 * 1000; // max 10 h Arbeit pro Tag

const { Tracer } = require('./tracing/Tracer');

/**
 * calculates the break time dependeing on the date (needed to use the right employer) and
 * the numbers of entries per day
 */
exports.getBreakTimeSeconds = (date) => {
  // console.log(date, moment(date, 'X'));
  // const dateMoment = moment(date * 1000, 'x');  // format 'x' is 'Unix ms timestamp'
  const dateMoment = moment(date, 'X'); // format 'X' is 'Unix timestamp'
  
  //console.log(`date ${dateMoment.format('DD.MM.YYYY')} is after 31.08.2021: ${dateMoment.isAfter('2021-08-31')}`);
  //console.log(`date ${dateMoment.format('DD.MM.YYYY')} is before 31.08.2021: ${dateMoment.isBefore('2023-10-01')}`);
  
  if (dateMoment.isAfter('2021-08-31') && dateMoment.isBefore('2023-10-01')) { // AOK enty date and exit date
    // AOK Bayern
    return AOK_BREAK_TIME_SECONDS;
  }
  return DEFAULT_BREAK_TIME_SECONDS;
};
exports.getBreakTimeMilliSeconds = (date) => this.getBreakTimeSeconds(date) * 1000;
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
  } else {
    // vor AOK Bayern
    bookedTime = busytime - pause;
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
  const span = Tracer.startSpan(`SLACK send message: ${notificationKey} - ${addedContent}`);

  const addedCtnt = (addedContent) || ''; // if addedContent is undefined set it with blank string
  console.log(`${notificationKey} (${addedCtnt})`);
  try {
    const toggle = await toggleUtil.getToggleByName(notificationKey);
    if (toggle != null && toggle.toggle === true) {
      // console.log(`toggle '${notificationKey}' switched on`);
      const msg = `(${moment.tz('Europe/Berlin').format('HH:mm:ss')}) *${toggle.notification}* ${addedCtnt}`;
      span.end();
      return this.sendTextMessage(msg);
    }
    return (`toggle ${notificationKey} switched off`);
  } catch (error) {
    span.recordException(error);
    span.end();
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
