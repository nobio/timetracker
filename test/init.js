/* eslint-disable max-len */
require('dotenv').config();
const logger = require('../api/config/logger'); // Logger configuration

process.env.SLACK_URL = '';
if (process.env.MONGODB_PROTOCOL
  && process.env.MONGODB_USER
  && process.env.MONGODB_PASSWORD
  && process.env.MONGODB_URI) {
  process.env.MONGODB_URL = `${process.env.MONGODB_PROTOCOL}://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_URI}`;
} else {
  process.env.MONGODB_URL = 'mongodb+srv://timetracker-user:cyfgeq-mypnu9-vozFyv@nobiocluster.arj0i.mongodb.net/timetrack?retryWrites=true&w=majority';
}
