require('../db');
const fs = require('fs');
const mongoose = require('mongoose');

const TimeEntry = mongoose.model('TimeEntry');
const StatsDay = mongoose.model('StatsDay');
const util = require('../api/stats/util-stats');
const utilTimeEntry = require('../api/entries/util-entries');
const utilTimebox = require('../api/stats/util-statstimebox');
const utilHistogram = require('../api/stats/util-histogram');
const utilBreaktime = require('../api/stats/util-breaktime');

const chai = require('chai');

const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const expect = chai.expect;
const assert = chai.assert;
const should = chai.should;

const moment = require('moment');
require('moment-timezone');

const DEFAULT_DATE = moment('1967-03-16');

/** ************************************************************ */
/** ************************************************************ */

describe('test util-breaktime - Promise', () => {
  let db;
  before(() => {
    db = require('../db');
  });

  const timeEntries = [
    {
      direction: 'enter',
      entry_date: '2014-02-20T06:46:33.899Z'
    },
    {
      direction: 'go',
      entry_date: '2014-02-20T11:00:00.000Z'
    },
    {
      direction: 'enter',
      entry_date: '2014-02-20T11:46:00.899Z'
    },
    {
      direction: 'go',
      entry_date: '2014-02-20T17:00:00.000Z'
    }
  ]

  it('getAllTimeEntriesGroupedByDate', async () => {
    await utilBreaktime.getAllTimeEntriesGroupedByDate(timeEntries)
      .then((result) => {
        expect(result).to.be.a('map')
        const ar = result.get('20.02.2014');
        expect(ar).to.be.an('array')
        expect(ar).to.have.lengthOf(4)
        expect(ar[0]).to.equal('1392878793');
        expect(ar[1]).to.equal('1392894000');
        expect(ar[2]).to.equal('1392896760');
        expect(ar[3]).to.equal('1392915600');
      })
      .catch((err) => {
        throw err;
      });
  });


  after(() => {
    db.closeConnection()
  });
});

// ========================================================================================================
