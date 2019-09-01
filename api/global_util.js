const moment = require('moment');
require('moment-timezone');
const toggleUtil = require('./admin/util-admin');

exports.DEFAULT_BREAK_TIME_SECONDS = 60 * 60;
exports.DEFAULT_BREAK_TIME_MILLISECONDS = this.DEFAULT_BREAK_TIME_SECONDS * 1000;


exports.DEFAULT_BREAK_TIME_SECONDS_XXX = () => {
  return 60 * 60;
}
exports.DEFAULT_BREAK_TIME_MILLISECONDS_XXX = () => {
  return this.DEFAULT_BREAK_TIME_SECONDS * 1000;
}

// An access token (from your Slack app or custom integration - xoxa, xoxp, or xoxb)
const SLACK_TOKEN = process.env.SLACK_TOKEN;
// This argument can be a channel ID, a DM ID, a MPDM ID, or a group ID
const CONVERSATION_ID = '#timetracker';
const { WebClient } = require('@slack/client');
/*
curl -X POST -H "Content-Type: application/json" -d '{"name":"CREATE_ENTRY", "toggle":true, "notification":"created new time entry"}' http://localhost:30000/api/toggles
curl -X POST -H "Content-Type: application/json" -d '{"name":"DELETE_ENTRY", "toggle":true, "notification":"delete time entry"}' http://localhost:30000/api/toggles
curl -X POST -H "Content-Type: application/json" -d '{"name":"BACKUP_DB", "toggle":true, "notification":"statistics have been backed up to database table"}' http://localhost:30000/api/toggles
curl -X POST -H "Content-Type: application/json" -d '{"name":"DUMP_FS", "toggle":true, "notification":"data has been dumped to file system"}' http://localhost:30000/api/toggles
curl -X POST -H "Content-Type: application/json" -d '{"name":"RECALCULATE", "toggle":true, "notification":"statistics have been calculated"}' http://localhost:30000/api/toggles
curl -X POST -H "Content-Type: application/json" -d '{"name":"SERVER_STARTED", "toggle":true, "notification":"timetracker server started up"}' http://localhost:30000/api/toggles
*/

/**
 * get a new token here: https://api.slack.com/custom-integrations/legacy-tokens
 */
exports.sendMessage = (notificationKey, addedContent) => new Promise((resolve, reject) => {
  const web = new WebClient(SLACK_TOKEN);
  toggleUtil.getToggleByName(notificationKey)
    .then((toggle) => {
      if (toggle != null && toggle.toggle === true) {
        console.log(`toggle ${notificationKey} switched on`);
        addedContent = (addedContent) || ''; // if addedContent is undefined set it with blank string
        return `(${moment.tz('Europe/Berlin').format('HH:mm:ss')}) ${toggle.notification} ${addedContent}`;
      }
      console.log(`toggle ${notificationKey} switched off`);
      resolve(`toggle ${notificationKey} switched off`);
    })
    .then((msg) => {
      // if no SLACK_TOKEN was found then lets just return the default slack response (test cases...)
      if (SLACK_TOKEN) {
        // See: https://api.slack.com/methods/chat.postMessage
        web.chat.postMessage({
          channel: CONVERSATION_ID,
          text: msg,
          as_user: false,
          username: 'Nobio Tech',
        })
          .then(result => resolve(result))
          .catch(err => reject(err));
      } else {
        reject(`could not send message '${msg}'; no SLACK token provided`);
      }
    })
    .catch(err => reject(`no message found ${err}`));
});
