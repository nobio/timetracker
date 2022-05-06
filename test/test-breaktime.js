require('./init');
const moment = require('moment');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const utilBreaktime = require('../api/stats/util-breaktime');
const g_util = require('../api/global_util');

chai.use(chaiAsPromised);
const { expect } = chai;
const { assert } = chai;

const TIME_ENTRIES_01 = [
  { direction: 'enter', entry_date: '2014-02-20T07:00:00.00Z' },
  { direction: 'go', entry_date: '2014-02-20T11:00:00.000Z' },
  { direction: 'enter', entry_date: '2014-02-20T11:50:00.899Z' },
  { direction: 'go', entry_date: '2014-02-20T17:00:00.000Z' },
];

const TIME_ENTRIES_02 = [
  { direction: 'enter', entry_date: '2014-02-20T07:00:00.00Z' },
  { direction: 'go', entry_date: '2014-02-20T11:00:00.000Z' },
  { direction: 'enter', entry_date: '2014-02-20T11:50:00.899Z' },
  { direction: 'go', entry_date: '2014-02-20T17:00:00.000Z' },
  { direction: 'enter', entry_date: '2014-02-21T06:00:00.000Z' },
  { direction: 'go', entry_date: '2014-02-21T16:00:00.000Z' },
];

const TIME_ENTRIES_02_AOK = [
  { direction: 'enter', entry_date: '2022-02-20T07:00:00.00Z' },
  { direction: 'go', entry_date: '2022-02-20T16:00:00.000Z' },
];

const TIME_ENTRIES_03_AOK = [
  { direction: 'enter', entry_date: '2022-02-20T07:30:00.00Z' },
  { direction: 'go', entry_date: '2022-02-20T12:00:00.000Z' },
  { direction: 'enter', entry_date: '2022-02-20T12:45:00.00Z' },
  { direction: 'go', entry_date: '2022-02-20T17:00:00.000Z' },
];

/** ************************************************************ */

describe('test util-breaktime - Promise', () => {
  it('getAllTimeEntriesGroupedByDate one day', async () => {
    let result;
    try {
      result = await utilBreaktime.getAllTimeEntriesGroupedByDate(TIME_ENTRIES_01);
    } catch (error) {
      assert.fail('should not throw exception');
    }
    expect(result).to.be.a('map');
    const ar = result.get('20.02.2014');
    expect(ar).to.be.an('array');
    expect(ar).to.have.lengthOf(4);
    expect(ar[0]).to.equal('1392879600');
    expect(ar[1]).to.equal('1392894000');
    expect(ar[2]).to.equal('1392897000');
    expect(ar[3]).to.equal('1392915600');
  });

  it('getAllTimeEntriesGroupedByDateTowDays', async () => {
    let result;
    try {
      result = await utilBreaktime.getAllTimeEntriesGroupedByDate(TIME_ENTRIES_02);
    } catch (error) {
      assert.fail('should not throw exception');
    }
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
  });

  it('prepareBreakTimes one day - all data', async () => {
    let result;
    try {
      const timeEntries = await utilBreaktime.getAllTimeEntriesGroupedByDate(TIME_ENTRIES_01);
      result = await utilBreaktime.prepareBreakTimes(timeEntries, false);
    } catch (error) {
      assert.fail('should not throw exception');
    }
    expect(result).to.be.an('array');
    expect(result).to.have.lengthOf(1);
    expect(result[0]).to.equal(50);
  });
  it('prepareBreakTimes one day - only real data', async () => {
    let result;
    try {
      const timeEntries = await utilBreaktime.getAllTimeEntriesGroupedByDate(TIME_ENTRIES_01);
      result = await utilBreaktime.prepareBreakTimes(timeEntries, true);
    } catch (error) {
      assert.fail('should not throw exception');
    }
    expect(result).to.be.an('array');
    expect(result).to.have.lengthOf(1);
    expect(result[0]).to.equal(50);
  });

  it('prepareBreakTimes two days - all data', async () => {
    let result;
    try {
      const timeEntries = await utilBreaktime.getAllTimeEntriesGroupedByDate(TIME_ENTRIES_02);
      result = await utilBreaktime.prepareBreakTimes(timeEntries, false);
    } catch (error) {
      console.log(error);
      assert.fail('should not throw exception');
    }
    expect(result).to.be.an('array');
    expect(result).to.have.lengthOf(2);
    expect(result[0]).to.equal(50);
    expect(result[1]).to.equal(60); // old break time
  });
  it('prepareBreakTimes two days AOK - all data', async () => {
    let result;
    try {
      const timeEntries = await utilBreaktime.getAllTimeEntriesGroupedByDate(TIME_ENTRIES_03_AOK);
      result = await utilBreaktime.prepareBreakTimes(timeEntries, false);
    } catch (error) {
      console.log(error);
      assert.fail('should not throw exception');
    }
    expect(result).to.be.an('array');
    expect(result).to.have.lengthOf(1);
    expect(result[0]).to.equal(45);
  });
  it('prepareBreakTimes two days - only real data', async () => {
    let result;
    try {
      const timeEntries = await utilBreaktime.getAllTimeEntriesGroupedByDate(TIME_ENTRIES_02);
      result = await utilBreaktime.prepareBreakTimes(timeEntries, true);
    } catch (error) {
      assert.fail('should not throw exception');
    }
    expect(result).to.be.an('array');
    expect(result).to.have.lengthOf(2);
    expect(result[0]).to.equal(50);
    expect(result[1]).to.equal(0); // no "measured" data -> 0
  });

  it('calculateHistogram one day, interval 1, all real', async () => {
    let result;
    try {
      const timeEntries = await utilBreaktime.getAllTimeEntriesGroupedByDate(TIME_ENTRIES_01);
      const preparedBreakTimes = await utilBreaktime.prepareBreakTimes(timeEntries, false);
      result = await utilBreaktime.calculateHistogram(preparedBreakTimes, 1, false);
    } catch (error) {
      assert.fail('should not throw exception');
    }
    expect(result).to.be.an('array');
    expect(result).to.have.lengthOf(121);
    expect(result[0]).to.have.property('time');
    expect(result[0]).to.have.property('breakTime');
    expect(result[44].breakTime).to.equal(0); // minute 45
    expect(result[49].breakTime).to.equal(1); // minute 50
  });
  it('calculateHistogram one day, interval 1, rale data', async () => {
    let result;
    try {
      const timeEntries = await utilBreaktime.getAllTimeEntriesGroupedByDate(TIME_ENTRIES_01);
      const preparedBreakTimes = await utilBreaktime.prepareBreakTimes(timeEntries, true);
      result = await utilBreaktime.calculateHistogram(preparedBreakTimes, 1, false);
    } catch (error) {
      assert.fail('should not throw exception');
    }
    expect(result).to.be.an('array');
    expect(result).to.have.lengthOf(121);
    expect(result[0]).to.have.property('time');
    expect(result[0]).to.have.property('breakTime');
    expect(result[44].breakTime).to.equal(0); // minute 45
    expect(result[49].breakTime).to.equal(1); // minute 50
  });
  it('calculateHistogram two days, interval 1, all data', async () => {
    let result;
    try {
      const timeEntries = await utilBreaktime.getAllTimeEntriesGroupedByDate(TIME_ENTRIES_02);
      const preparedBreakTimes = await utilBreaktime.prepareBreakTimes(timeEntries, false);
      result = await utilBreaktime.calculateHistogram(preparedBreakTimes, 1, false);
    } catch (error) {
      assert.fail('should not throw exception');
    }
    expect(result).to.be.an('array');
    expect(result).to.have.lengthOf(121);
    expect(result[0]).to.have.property('time');
    expect(result[0]).to.have.property('breakTime');
    expect(result[59].breakTime).to.equal(1); // minute 45
    expect(result[49].breakTime).to.equal(1); // minute 50
    expect(result[60].breakTime).to.equal(0);
  });
  it('calculateHistogram two days, interval 1, real data', async () => {
    let result;
    try {
      const timeEntries = await utilBreaktime.getAllTimeEntriesGroupedByDate(TIME_ENTRIES_02);
      const preparedBreakTimes = await utilBreaktime.prepareBreakTimes(timeEntries, true);
      result = await utilBreaktime.calculateHistogram(preparedBreakTimes, 1, false);
    } catch (error) {
      assert.fail('should not throw exception');
    }
    expect(result).to.be.an('array');
    expect(result).to.have.lengthOf(121);
    expect(result[0]).to.have.property('time');
    expect(result[0]).to.have.property('breakTime');
    expect(result[44].breakTime).to.equal(0); // minute 45
    expect(result[49].breakTime).to.equal(1); // minute 50
  });

  it('calculateHistogram two days, interval 20, real data', async () => {
    let result;
    try {
      const timeEntries = await utilBreaktime.getAllTimeEntriesGroupedByDate(TIME_ENTRIES_02);
      const preparedBreakTimes = await utilBreaktime.prepareBreakTimes(timeEntries, true);
      result = await utilBreaktime.calculateHistogram(preparedBreakTimes, 20, true);
    } catch (error) {
      assert.fail('should not throw exception');
    }
    expect(result[2].breakTime).to.equal(1); // time: 40 - 59
  });
  it('calculateHistogram two days, interval 20, all data', async () => {
    let result;
    try {
      const timeEntries = await utilBreaktime.getAllTimeEntriesGroupedByDate(TIME_ENTRIES_02);
      const preparedBreakTimes = await utilBreaktime.prepareBreakTimes(timeEntries, false);
      result = await utilBreaktime.calculateHistogram(preparedBreakTimes, 20, true);
    } catch (error) {
      assert.fail('should not throw exception');
    }
    expect(result[2].breakTime).to.equal(2); // time: 40 - 59
  });
});

describe('test g_util.getBreakTime...', () => {
  const TIME_BEFORE_AOK = moment('2018-02-01').unix();
  const TIME_DURING_AOK = moment('2022-02-01').unix();

  it('getBreakTimeSeconds before AOK', async () => {
    const result = await g_util.getBreakTimeSeconds(TIME_BEFORE_AOK);
    expect(result).to.equal(60 * 60); // default time before AOK
  });
  it('getBreakTimeSeconds during AOK', async () => {
    const result = await g_util.getBreakTimeSeconds(TIME_DURING_AOK);
    expect(result).to.equal(30 * 60); // time during AOK
  });
  it('getBreakTimeSeconds with invalid date (-> default)', async () => {
    const result = await g_util.getBreakTimeSeconds();
    expect(result).to.equal(60 * 60); // default
  });
  it('getBreakTimeMilliSeconds before AOK', async () => {
    const result = await g_util.getBreakTimeMilliSeconds(TIME_BEFORE_AOK);
    expect(result).to.equal(60 * 60 * 1000); // default time before AOK
  });
  it('getBreakTimeMilliSeconds during AOK', async () => {
    const result = await g_util.getBreakTimeMilliSeconds(TIME_DURING_AOK);
    expect(result).to.equal(30 * 60 * 1000); // time during AOK
  });
  it('getBreakTimeMilliSeconds with invalid date (-> default)', async () => {
    const result = await g_util.getBreakTimeMilliSeconds();
    expect(result).to.equal(60 * 60 * 1000); // default
  });
});

describe('test g_util.getBookedTimeMilliSeconds...', () => {
  it('getBookedTimeMilliSeconds before AOK with 2 entries', async () => {
    const result = await g_util.getBookedTimeMilliSeconds(100000, 5000, moment('2018-02-01').unix(), 2);
    expect(result).to.equal(100000 - 5000); // default time before AOK
  });
  it('getBookedTimeMilliSeconds before AOK with 4 entries', async () => {
    const result = await g_util.getBookedTimeMilliSeconds(100000, 5000, moment('2018-02-01').unix(), 4);
    expect(result).to.equal(100000 - 5000); // default time before AOK
  });
  it('getBookedTimeMilliSeconds after AOK with 2 entries', async () => {
    const result = await g_util.getBookedTimeMilliSeconds(100000, 5000, moment('2022-02-01').unix(), 2);
    expect(result).to.equal(100000 - 5000 + 504 * 60); // default time before AOK
  });
  it('getBookedTimeMilliSeconds after AOK with 4 entries', async () => {
    const result = await g_util.getBookedTimeMilliSeconds(100000, 5000, moment('2022-02-01').unix(), 4);
    expect(result).to.equal(100000 + 504 * 60); // default time before AOK
  });
});
