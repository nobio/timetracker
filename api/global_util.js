const Axios = require('axios');
const moment = require('moment');
const toggleUtil = require('./admin/util-toggles');
require('moment-timezone');

exports.DEFAULT_BREAK_TIME_SECONDS = 30 * 60;
exports.DEFAULT_BREAK_TIME_MILLISECONDS = this.DEFAULT_BREAK_TIME_SECONDS * 1000;

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
exports.sendMessage = async function (notificationKey, addedContent) {
  try {
    const toggle = await toggleUtil.getToggleByName(notificationKey);
    if (toggle != null && toggle.toggle === true) {
      // console.log(`toggle '${notificationKey}' switched on`);
      addedContent = (addedContent) || ''; // if addedContent is undefined set it with blank string
      const msg = `(${moment.tz('Europe/Berlin').format('HH:mm:ss')}) *${toggle.notification}* ${addedContent}`;
      return this.sendTextMessage(msg);
    } else {
      return (`toggle ${notificationKey} switched off`);
    }
  } catch (error) {
    return error.message;
  }
};

/**
 * just send any text to slack; please mind that it could be markd down formatted
 * @param {*} message
 * @returns
 */
exports.sendTextMessage = async function (message) {
  // if no SLACK_URL was found then lets just return the default slack response (test cases...)
  if (SLACK_URL) {
    const result = await Axios.post(
      `${SLACK_URL}`,
      {
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `${message}`,
            },
          },
        ],
      },
    );
    return result;
  }

  return (`could not send message <'${message}'> to SLACK (no slack url provided); logging to stderr instead`);
};
