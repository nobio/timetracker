require('dotenv').config(); process.env.SLACK_URL = '';
const utilBreaktime = require('../api/stats/util-breaktime');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const expect = chai.expect;

const TIME_ENTRIES_01 = [
  {
    direction: 'enter',
    entry_date: '2014-02-20T07:00:00.00Z',
  },
  {
    direction: 'go',
    entry_date: '2014-02-20T11:00:00.000Z',
  },
  {
    direction: 'enter',
    entry_date: '2014-02-20T11:50:00.899Z',
  },
  {
    direction: 'go',
    entry_date: '2014-02-20T17:00:00.000Z',
  },
];

const TIME_ENTRIES_02 = [
  {
    direction: 'enter',
    entry_date: '2014-02-20T07:00:00.00Z',
  },
  {
    direction: 'go',
    entry_date: '2014-02-20T11:00:00.000Z',
  },
  {
    direction: 'enter',
    entry_date: '2014-02-20T11:50:00.899Z',
  },
  {
    direction: 'go',
    entry_date: '2014-02-20T17:00:00.000Z',
  },
  {
    direction: 'enter',
    entry_date: '2014-02-21T06:00:00.000Z',
  },
  {
    direction: 'go',
    entry_date: '2014-02-21T16:00:00.000Z',
  },
];

/** ************************************************************ */

describe('test util-breaktime - Promise', () => {
  it('getAllTimeEntriesGroupedByDate one day', async () => {
    try {
      const result = await utilBreaktime.getAllTimeEntriesGroupedByDate(TIME_ENTRIES_01);
      expect(result).to.be.a('map');
      const ar = result.get('20.02.2014');
      expect(ar).to.be.an('array');
      expect(ar).to.have.lengthOf(4);
      expect(ar[0]).to.equal('1392879600');
      expect(ar[1]).to.equal('1392894000');
      expect(ar[2]).to.equal('1392897000');
      expect(ar[3]).to.equal('1392915600');
    } catch (error) {
      assert.fail('should not throw exception')
    }
  });

  it('getAllTimeEntriesGroupedByDateTowDays', async () => {
    try {
      const result = await utilBreaktime.getAllTimeEntriesGroupedByDate(TIME_ENTRIES_02);
      expect(result).to.be.a('map');
      let ar = result.get('20.02.2014');
      expect(ar).to.be.an('array');
      expect(ar).to.have.lengthOf(4);
      expect(ar[0]).to.equal('1392879600');
      expect(ar[1]).to.equal('1392894000');
      expect(ar[2]).to.equal('1392897000');
      expect(ar[3]).to.equal('1392915600');

      ar = result.get('21.02.2014');
      expect(ar).to.be.an('array');
      expect(ar).to.have.lengthOf(2);
      expect(ar[0]).to.equal('1392962400');
      expect(ar[1]).to.equal('1392998400');
    } catch (error) {
      assert.fail('should not throw exception')
    }
  });

  it('prepareBreakTimes one day - all data', async () => {
    try {
      const timeEntries = await utilBreaktime.getAllTimeEntriesGroupedByDate(TIME_ENTRIES_01)
      const result = await utilBreaktime.prepareBreakTimes(timeEntries, false);
      expect(result).to.be.an('array');
      expect(result).to.have.lengthOf(1);
      expect(result[0]).to.equal(50);
    } catch (error) {
      assert.fail('should not throw exception')
    }
  });
  it('prepareBreakTimes one day - only real data', async () => {
    try {
      const timeEntries = await utilBreaktime.getAllTimeEntriesGroupedByDate(TIME_ENTRIES_01);
      const result = await utilBreaktime.prepareBreakTimes(timeEntries, true);
      expect(result).to.be.an('array');
      expect(result).to.have.lengthOf(1);
      expect(result[0]).to.equal(50);
    } catch (error) {
      assert.fail('should not throw exception')
    }
  });


  it('prepareBreakTimes two days - all data', async () => {
    try {
      const timeEntries = await utilBreaktime.getAllTimeEntriesGroupedByDate(TIME_ENTRIES_02);
      const result = await utilBreaktime.prepareBreakTimes(timeEntries, false);
      expect(result).to.be.an('array');
      expect(result).to.have.lengthOf(2);
      expect(result[0]).to.equal(50);
      expect(result[1]).to.equal(30);  // old break time
    } catch (error) {
      assert.fail('should not throw exception')
    }
  });
  it('prepareBreakTimes two days - only real data', async () => {
    try {
      const timeEntries = await utilBreaktime.getAllTimeEntriesGroupedByDate(TIME_ENTRIES_02);
      const result = await utilBreaktime.prepareBreakTimes(timeEntries, true);
      expect(result).to.be.an('array');
      expect(result).to.have.lengthOf(2);
      expect(result[0]).to.equal(50);
      expect(result[1]).to.equal(0); // no "measured" data -> 0
    } catch (error) {
      assert.fail('should not throw exception')
    }
  });

  it('calculateHistogram one day, interval 1, all real', async () => {
    try {
      const timeEntries = await utilBreaktime.getAllTimeEntriesGroupedByDate(TIME_ENTRIES_01);
      const preparedBreakTimes = await utilBreaktime.prepareBreakTimes(timeEntries, false);
      const result = await utilBreaktime.calculateHistogram(preparedBreakTimes, 1, false);
      expect(result).to.be.an('array');
      expect(result).to.have.lengthOf(121);
      expect(result[0]).to.have.property('time');
      expect(result[0]).to.have.property('breakTime');
      expect(result[44].breakTime).to.equal(0); // minute 45
      expect(result[49].breakTime).to.equal(1); // minute 50
    } catch (error) {
      assert.fail('should not throw exception')
    }
  });
  it('calculateHistogram one day, interval 1, rale data', async () => {
    try {
      const timeEntries = await utilBreaktime.getAllTimeEntriesGroupedByDate(TIME_ENTRIES_01);
      const preparedBreakTimes = await utilBreaktime.prepareBreakTimes(timeEntries, true);
      const result = await utilBreaktime.calculateHistogram(preparedBreakTimes, 1, false);
      expect(result).to.be.an('array');
      expect(result).to.have.lengthOf(121);
      expect(result[0]).to.have.property('time');
      expect(result[0]).to.have.property('breakTime');
      expect(result[44].breakTime).to.equal(0); // minute 45
      expect(result[49].breakTime).to.equal(1); // minute 50
    } catch (error) {
      assert.fail('should not throw exception')
    }
  });
  it('calculateHistogram two days, interval 1, all data', async () => {
    try {
      const timeEntries = await utilBreaktime.getAllTimeEntriesGroupedByDate(TIME_ENTRIES_02);
      const preparedBreakTimes = await utilBreaktime.prepareBreakTimes(timeEntries, false);
      const result = await utilBreaktime.calculateHistogram(preparedBreakTimes, 1, false);
      expect(result).to.be.an('array');
      expect(result).to.have.lengthOf(121);
      expect(result[0]).to.have.property('time');
      expect(result[0]).to.have.property('breakTime');
      expect(result[59].breakTime).to.equal(0); // minute 45
      expect(result[49].breakTime).to.equal(1); // minute 50
    } catch (error) {
      assert.fail('should not throw exception')
    }
  });
  it('calculateHistogram two days, interval 1, real data', async () => {
    try {
      const timeEntries = await utilBreaktime.getAllTimeEntriesGroupedByDate(TIME_ENTRIES_02);
      const preparedBreakTimes = await utilBreaktime.prepareBreakTimes(timeEntries, true);
      const result = await utilBreaktime.calculateHistogram(preparedBreakTimes, 1, false);
      expect(result).to.be.an('array');
      expect(result).to.have.lengthOf(121);
      expect(result[0]).to.have.property('time');
      expect(result[0]).to.have.property('breakTime');
      expect(result[44].breakTime).to.equal(0); // minute 45
      expect(result[49].breakTime).to.equal(1); // minute 50
    } catch (error) {
      assert.fail('should not throw exception')
    }
  });

  it('calculateHistogram two days, interval 20, real data', async () => {
    try {
      const timeEntries = await utilBreaktime.getAllTimeEntriesGroupedByDate(TIME_ENTRIES_02);
      const preparedBreakTimes = await utilBreaktime.prepareBreakTimes(timeEntries, true);
      const result = await utilBreaktime.calculateHistogram(preparedBreakTimes, 20, true);
      expect(result[2].breakTime).to.equal(1); // time: 40 - 59
    } catch (error) {
      assert.fail('should not throw exception')
    }
  });
  it('calculateHistogram two days, interval 20, all data', async () => {
    try {
      const timeEntries = await utilBreaktime.getAllTimeEntriesGroupedByDate(TIME_ENTRIES_02)
      const preparedBreakTimes = await utilBreaktime.prepareBreakTimes(timeEntries, false);
      const result = await utilBreaktime.calculateHistogram(preparedBreakTimes, 20, true);
      expect(result[2].breakTime).to.equal(1); // time: 40 - 59
    } catch (error) {
      assert.fail('should not throw exception')
    }
  });
});
