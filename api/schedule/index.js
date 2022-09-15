const admin = require('../admin/util-admin');
const stats = require('../stats/util-stats');
const entries = require('../entries/util-entries');
const auth = require('../auth/util-auth');

/** ******************************************************************************
 * Get one Time Entry by it's id
 *
 * curl -X PUT http://localhost:30000/api/schedule?jobclass=calcStats
 ****************************************************************************** */
exports.schedule = (req, res) => {
  const jobClass = req.query.jobclass;
  if (!jobClass) { res.status(400).send('no jobclass provided'); return; }
  console.log(`job class found: [${jobClass}]`);

  switch (jobClass) {
    case 'calcStats':
      stats.calcStats().then(res.status(200).send('calcStats ok')).catch((err) => console.error(err));
      break;

    case 'dumpModels':
      admin.dumpModels().then(res.status(200).send('dumpModels ok')).catch((err) => console.error(err));
      break;

    case 'backupTimeEntries':
      admin.backupTimeEntries().then(res.status(200).send('backupTimeEntries ok')).catch((err) => console.error(err));
      break;

    case 'evaluate':
      entries.evaluate().then(res.status(200).send('evaluate ok')).catch((err) => console.error(err));
      break;

    case 'removeTesterToken':
      auth.removeTesterToken().then(res.status(200).send('removeTesterToken ok')).catch((err) => console.error(err));
      break;

    case 'removeExpiredToken':
      auth.removeExpiredToken().then(res.status(200).send('removeExpiredToken ok')).catch((err) => console.error(err));
      break;

    default:
      res.status(400).send('invalid jobclass provided');
      console.log('go fuck yourself');
  }
};
