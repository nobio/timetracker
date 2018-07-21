const MONGO_URL_MLAB='mongodb://nobio:1gR7hW2cPhtkRlv2@ds061928.mlab.com:61928/timetrack';
const MONGO_URL_DOCKER='mongodb://qnap-nas:27017/timetracker npm start';


console.log('init database');

const mongoose = require('mongoose');
const schema = mongoose.Schema;
mongoose.Promise = global.Promise;

// TimeEntry
const directions = 'enter go'.split(' ');
const TimeEntry = new schema({
  entry_date: { type: Date, required: true, default: Date.now, index: true },
  direction: { type: String, enum: directions, required: true },
  last_changed: { type: Date, default: Date.now, required: true },
  longitude: { type: Number, required: false },
  latitude: { type: Number, required: false },
});
mongoose.model('TimeEntry', TimeEntry);


mongoose.connect(MONGO_URL_MLAB, { useNewUrlParser: true }).then(
    () => {
        console.log('connected to source database');
        console.log('loading data from source...');
        console.log('connecting to target database...');
        console.log('clearing target...');
        console.log('storing data to target');
        console.log('I am done!');
        return;
    },
    (err) => {
      console.log(`error while connecting mongodb:${err}`);
    },
  );
  