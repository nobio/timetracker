require('dotenv').config();

process.env.SLACK_URL = '';
process.env.MONGODB_URL = `mongodb+srv://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_URI}`;
