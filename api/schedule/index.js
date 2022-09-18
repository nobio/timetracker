const admin = require('../admin/util-admin');
const stats = require('../stats/util-stats');
const entries = require('../entries/util-entries');
const auth = require('../auth/util-auth');

/** ******************************************************************************
 * Get one Time Entry by it's id
 *
 * curl -X PUT http://localhost:30000/api/schedule?jobclass=CALC_STATS
 ****************************************************************************** */
exports.schedule = (req, res) => {
  const jobClass = req.query.jobclass;
  if (!jobClass) { res.status(400).send('no jobclass provided'); return; }
  console.log(`job class found: [${jobClass}]`);

  switch (jobClass) {
    case 'CALC_STATS':
      stats.calcStats().then(res.status(200).send('calc statistics ok')).catch((err) => console.error(err));
      break;

    case 'DUMP_MODELS':
      admin.dumpModels().then(res.status(200).send('dump models to database ok')).catch((err) => console.error(err));
      break;

    case 'BACKUP_TIME_ENTRIES':
      admin.backupTimeEntries().then(res.status(200).send('backup time entries to file system ok')).catch((err) => console.error(err));
      break;

    case 'EVALUATE':
      entries.evaluate().then(res.status(200).send('evaluate data ok')).catch((err) => console.error(err));
      break;

    case 'REMOVE_TESTER_TOKEN':
      auth.removeTesterToken().then(res.status(200).send('remove tester tokens ok')).catch((err) => console.error(err));
      break;

    case 'REMOVE_EXIRED_TOKEN':
      auth.removeExpiredToken().then(res.status(200).send('remove expired tokens ok')).catch((err) => console.error(err));
      break;

    default:
      res.status(400).send('invalid jobclass provided');
      console.log('go fuck yourself');
  }
};
