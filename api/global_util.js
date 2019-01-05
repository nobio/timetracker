const moment = require('moment');

// An access token (from your Slack app or custom integration - xoxa, xoxp, or xoxb)
const SLACK_TOKEN = process.env.SLACK_TOKEN;
// This argument can be a channel ID, a DM ID, a MPDM ID, or a group ID
const CONVERSATION_ID = '#timetracker';

const { WebClient } = require('@slack/client');

/**
 * get a new token here: https://api.slack.com/custom-integrations/legacy-tokens
 */
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