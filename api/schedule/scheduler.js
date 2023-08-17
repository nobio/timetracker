const scheduler = require('node-schedule');
const admin = require('../admin/util-admin');
const stats = require('../stats/util-stats');
const entries = require('../entries/util-entries');
const auth = require('../auth/util-auth');
const geofence = require('../admin/util-geofences');
const { Tracer } = require('../tracing/Tracer');

/**
 * start scheduler to run tasks
 */
exports.scheduleTasks = function () {
  // start the scheduler
  console.log('job scheduler: calcStats (every hour at ??:00)');
  scheduler.scheduleJob({ minute: 0 }, () => { // every hour at ??:00
    console.log('scheduled task "calcStats" started');
    const span = Tracer.startSpan('scheduleTasks.calcStats');
    stats.calcStats().catch((err) => console.error(err)).finally(() => span.end());
  });

  console.log('job scheduler: dumpModels (every day at 12:05)');
  scheduler.scheduleJob({ hour: 12, minute: 5 }, () => { // every day at 12:05
    console.log('scheduled task "dumpModels" started');
    const span = Tracer.startSpan('scheduleTasks.dumpModels');
    admin.dumpModels().catch((err) => console.error(err)).finally(() => span.end());
  });

  console.log('job scheduler: backupTimeEntry (every hour at 10 past (??:10)');
  scheduler.scheduleJob({ minute: 10 }, () => {
    console.log('scheduled task "backupTimeEntry" started');
    const span = Tracer.startSpan('scheduleTasks.backupTimeEntry');
    admin.backupTimeEntries().catch((err) => console.error(err)).finally(() => span.end());
  });

  console.log('job scheduler: data evaluate (every hour at ??:12)');
  scheduler.scheduleJob({ minute: 12 }, () => {
    console.log('scheduled task "evaluate" started');
    const span = Tracer.startSpan('scheduleTasks.evaluate');
    entries.evaluate().catch((err) => console.error(err)).finally(() => span.end());
  });

  console.log('job scheduler: remove tokens of user \'Tester\' (every day at 21:59)');
  scheduler.scheduleJob({ hour: 21, minute: 50 }, () => { // every hour at ??:13
    console.log('scheduled task "removeTesterToken" started');
    const span = Tracer.startSpan('scheduleTasks.removeTesterToken');
    auth.removeTesterToken().catch((err) => console.error(err)).finally(() => span.end());
  });

  console.log('job scheduler: remove expired Tokens (every day at 21:15)');
  scheduler.scheduleJob({ hour: 21, minute: 15 }, () => { // every hour at ??:13
    console.log('scheduled task "removeExpiredTokens" started');
    const span = Tracer.startSpan('scheduleTasks.removeExpiredTokens');
    auth.removeExpiredToken().catch((err) => console.error(err)).finally(() => span.end());
  });

  console.log('job scheduler: reset geofence cehckins (every day at 21:20)');
  scheduler.scheduleJob({ hour: 21, minute: 20 }, () => { // every hour at 21:20
    console.log('scheduled task "resetGeofenceCheckins" started');
    const span = Tracer.startSpan('scheduleTasks.resetGeofenceCheckins');
    geofence.resetGeofenceCheckins().catch((err) => console.error(err)).finally(() => span.end());
  });

  /*
    console.log("job scheduler: test");
    scheduler.scheduleJob({}, function() {
        console.log('schedule: ' + new Date());
    });
  */

  /*
    # .---------------- minute (0 - 59)
    # |  .------------- hour (0 - 23)
    # |  |  .---------- day of month (1 - 31)
    # |  |  |  .------- month (1 - 12) OR jan,feb,mar,apr ...
    # |  |  |  |  .---- day of week (0 - 6) (Sunday=0 or 7) OR sun,mon,tue,wed,thu,fri,sat
    # |  |  |  |  |
    # *  *  *  *  * user-name  command to be executed
    schedule.scheduleJob('0 17 ? * 0,4-6', function(){
    */
};

exports.getEntryById = (req, res) => {
  util.findById(req.params.id)
    .then((timeentry) => res.status(200).send(timeentry))
    .catch((err) => res.status(500).send(`Error while reading Time Entry: ${req.params.id} ${err.message}`));
};
