const moment = require('moment');
require('moment-timezone');

// An access token (from your Slack app or custom integration - xoxa, xoxp, or xoxb)
const SLACK_TOKEN = process.env.SLACK_TOKEN;
// This argument can be a channel ID, a DM ID, a MPDM ID, or a group ID
const CONVERSATION_ID = '#timetracker';
const { WebClient } = require('@slack/client');

const NOTIFICATION_TOGGLES = {
  CREATE_ENTRY: { toggle: false, notification: 'created new time entry' },
  DELETE_ENTRY: { toggle: false, notification: 'delete time entry' },
  BACKUP_DB: { toggle: false, notification: 'statistics have been backed up to database table' },
  DUMP_FS: { toggle: false, notification: 'data has been dumped to file system' },
  RECALCULATE: { toggle: false, notification: 'statistics have been calculated' },
};
let notificationsLoaded = false;
/*
curl -X POST  -H "Content-Type: application/json" -d '{"name":"CREATE_ENTRY", "toggle":true}' http://localhost:30000/api/toggles
curl -X POST  -H "Content-Type: application/json" -d '{"name":"DELETE_ENTRY", "toggle":true}' http://localhost:30000/api/toggles
curl -X POST  -H "Content-Type: application/json" -d '{"name":"BACKUP_DB", "toggle":true}' http://localhost:30000/api/toggles
curl -X POST  -H "Content-Type: application/json" -d '{"name":"DUMP_FS", "toggle":true}' http://localhost:30000/api/toggles
curl -X POST  -H "Content-Type: application/json" -d '{"name":"RECALCULATE", "toggle":true}' http://localhost:30000/api/toggles
*/

/**
 * get a new token here: https://api.slack.com/custom-integrations/legacy-tokens
 */
exports.sendMessage = (notificationKey, addedContent) => new Promise((resolve, reject) => {
  if (NOTIFICATION_TOGGLES[notificationKey] && NOTIFICATION_TOGGLES[notificationKey].toggle) {
    const web = new WebClient(SLACK_TOKEN);
    const message = (NOTIFICATION_TOGGLES[notificationKey] ? NOTIFICATION_TOGGLES[notificationKey].notification : addedContent);
    const msg = `(${moment.tz('Europe/Berlin').format('HH:mm:ss')}) ${message} ${addedContent}`;
    // console.log(msg);

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
      resolve('ignoring Slack; no token provided');
    }
  }
});

exports.loadNotificationToggles = () => new Promise((resolve, reject) => {
  //console.log(`notificationsLoaded: ${notificationsLoaded}`);

  if (notificationsLoaded) {
    // console.log('notificaiton toggles already loaded...')
    resolve(true);
  } else {
    console.log('loading notificaiton toggles...');
    require('./admin/util-admin').getAllToggles()
      .then((toggleArray) => {

        toggleArray.forEach((tg) => {
          if (NOTIFICATION_TOGGLES[tg.name]) {
            NOTIFICATION_TOGGLES[tg.name].toggle = tg.toggle;
          }
        });
        notificationsLoaded = true;
        console.log('loaded notificaiton toggles');
        console.log(JSON.stringify(NOTIFICATION_TOGGLES));
        resolve(true);
      })
      .catch(err => reject(err));
  }
});

