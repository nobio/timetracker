const moment = require('moment');

// An access token (from your Slack app or custom integration - xoxa, xoxp, or xoxb)
const SLACK_TOKEN = 'xoxp-403948417110-402765462469-515689518066-27f6eea1b1f278778522b8004130858b';
// This argument can be a channel ID, a DM ID, a MPDM ID, or a group ID
const CONVERSATION_ID = '#timetracker';

const { WebClient } = require('@slack/client');

exports.sendMessage = message => new Promise((resolve, reject) => {
  const web = new WebClient(SLACK_TOKEN);
  const msg = '(' + moment().format('HH:mm:ss') + ') '+ message;
  console.log(msg);

  // See: https://api.slack.com/methods/chat.postMessage
  web.chat.postMessage({
    channel: CONVERSATION_ID,
    text: msg,
    as_user: false,
    username: 'Nobio Tech',
  })
    .then(result => resolve(result))
    .catch(err => reject(err));
});
