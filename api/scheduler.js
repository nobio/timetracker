const scheduler = require('node-schedule');
const admin = require('./admin/util-admin');
const stats = require('./stats/util-stats');
const entries = require('./entries/util-entries');
const auth = require('./auth/util-auth');

/**
 * start scheduler to run tasks
 */
exports.scheduleTasks = function () {
  // start the scheduler
  console.log('job scheduler: calcStats (every hour at ??:00)');
  scheduler.scheduleJob({ minute: 0 }, () => { // every hour at ??:00
    console.log('scheduled task "calcStats" started');
    stats.calcStats();
  });

  console.log('job scheduler: dumpModels (every day at 12:05)');
  scheduler.scheduleJob({ hour: 12, minute: 5 }, () => { // every day at 12:05
    console.log('scheduled task "dumpModels" started');
    admin.dumpModels();
  });

  console.log('job scheduler: backupTimeEntry (every hour at 10 past (??:10)');
  scheduler.scheduleJob({ minute: 10 }, () => {
    console.log('scheduled task "backupTimeEntry" started');
    admin.backupTimeEntries();
  });

  console.log('job scheduler: data evaluate (every hour at ??:12)');
  scheduler.scheduleJob({ minute: 12 }, () => {
    console.log('scheduled task "evaluate" started');
    entries.evaluate();
  });

  console.log('job scheduler: remove tokens of user \'Tester\' (every day at 21:59)');
  scheduler.scheduleJob({ hour: 21, minute: 50 }, () => { // every hour at ??:13
    console.log('scheduled task "removeTesterToken" started');
    auth.removeTesterToken();
  });

  console.log('job scheduler: remove expired Tokens (every day at 21:59)');
  scheduler.scheduleJob({ hour: 23 }, () => { // every hour at ??:13
    console.log('scheduled task "removeExpiredTokens" started');
    auth.removeExpiredToken();
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
