const mongoose = require('mongoose');

const schema = mongoose.Schema;

const MONGO_URL_MLAB = 'mongodb://nobio:1gR7hW2cPhtkRlv2@ds061928.mlab.com:61928/timetrack';
const MONGO_URL_DOCKER = 'mongodb://qnap-nas:27017/timetracker';

const MONGO_URL_SOURCE = MONGO_URL_MLAB;
const MONGO_URL_TARGET = MONGO_URL_DOCKER;
//const MONGO_URL_SOURCE = MONGO_URL_DOCKER;
//const MONGO_URL_TARGET = MONGO_URL_MLAB;


const migrationData = [];

/* ==================================================================== */

// Schema
const directions = 'enter go'.split(' ');
const TimeEntry = new schema({
    entry_date: {
        type: Date, required: true, default: Date.now, index: true,
    },
    direction: { type: String, enum: directions, required: true },
    last_changed: { type: Date, default: Date.now, required: true },
    longitude: { type: Number, required: false },
    latitude: { type: Number, required: false },
});

const TIME_ENTRY_MODEL_SOURCE = mongoose.model('TimeEntry', TimeEntry);
const TIME_ENTRY_MODEL_TARGET = mongoose.model('TimeEntry', TimeEntry);

/**
 * Reads data from source data source and returns an json array
 */
function getDataFromSource() {
    return new Promise((resolve, reject) => {
        mongoose.connect(MONGO_URL_SOURCE, { useNewUrlParser: true });

        TIME_ENTRY_MODEL_SOURCE.find()
            .then((timeEntries) => {
                mongoose.connection.close();
                resolve(timeEntries);
            })
            .catch((err) => {
                mongoose.connection.close();
                reject(err);
            });
    });
}

function deleteAllTarget() {
    mongoose.connect(MONGO_URL_TARGET, { useNewUrlParser: true });

    return new Promise((resolve, reject) => {
        TIME_ENTRY_MODEL_TARGET.remove()
            .then(() => resolve('ok'))
            .catch((err) => reject(err));
    });
}

/**
 * Stores the data to target data srouce read from source data source
 *
 * @param {timeEntries} timeEntries
 */
function storeDataToTarget(timeEntries) {
    let n = 0;
    mongoose.connect(MONGO_URL_TARGET, { useNewUrlParser: true });
    return new Promise((resolve, reject) => {

        timeEntries.forEach(timeentry => {

            process.stdout.write('.');
            new TIME_ENTRY_MODEL_TARGET({
                _id: timeentry._id,
                entry_date: timeentry.entry_date,
                direction: timeentry.direction,
                last_changed: timeentry.last_changed,
                longitude: timeentry.longitude,
                latitude: timeentry.latitude,
            }).save()
                .then(doc => {
                    n++;
                    if (n >= timeEntries.length) { mongoose.connection.close(); }
                })
                .catch(err => {
                    n++;
                    console.log(err.message);
                    if (n >= timeEntries.length) { mongoose.connection.close(); }
                    //reject(err);
                });
        });

        resolve(`${timeEntries.length} elements saved`);
        //mongoose.connection.close();

    });
}

// start the migration...
getDataFromSource()
    .then(storeDataToTarget)
    .then(msg => console.log(msg))
    .catch((err) => {
        console.log(err);
        console.log('***********************************************************************')
        process.exit(-1);
    })
