const logger = require('../api/config/logger'); // Logger configuration
/* eslint-disable max-len */
require('./init');
const moment = require('moment');

const Chai = require('chai');
const Mocha = require('mocha');
const utilBreaktime = require('../api/stats/util-breaktime');
const globalUtil = require('../api/global_util');

const { describe, it } = Mocha;
const { expect, assert } = Chai;

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
      logger.info(error);
      assert.fail('should not throw exception');
    }
    expect(result).to.be.an('array');
    expect(result).to.have.lengthOf(2);
    expect(result[0]).to.equal(50);
    expect(result[1]).to.equal(45); // old break time
  });
  it('prepareBreakTimes two days AOK - all data', async () => {
    let result;
    try {
      const timeEntries = await utilBreaktime.getAllTimeEntriesGroupedByDate(TIME_ENTRIES_03_AOK);
      result = await utilBreaktime.prepareBreakTimes(timeEntries, false);
    } catch (error) {
      logger.info(error);
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
    expect(result[51].breakTime).to.equal(1); // minute 50
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
    expect(result[51].breakTime).to.equal(1); // minute 50
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
    expect(result[44].breakTime).to.equal(1); // minute 45
    expect(result[51].breakTime).to.equal(1); // minute 50
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
    expect(result[51].breakTime).to.equal(1); // minute 50
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
    const result = await globalUtil.getBreakTimeSeconds(TIME_BEFORE_AOK);
    expect(result).to.equal(45 * 60); // default time before AOK
  });
  it('getBreakTimeSeconds during AOK', async () => {
    const result = await globalUtil.getBreakTimeSeconds(TIME_DURING_AOK);
    expect(result).to.equal(30 * 60); // time during AOK
  });
  it('getBreakTimeSeconds with invalid date (-> default)', async () => {
    const result = await globalUtil.getBreakTimeSeconds();
    expect(result).to.equal(45 * 60); // default
  });
  it('test getBreakTimeSeconds(date) with date in the past before AOK (1970-01-01)', () => {
    const timestamp = globalUtil.getBreakTimeSeconds(moment('1970-01-01'));
    expect(timestamp).to.equal(45 * 60);
  });

  it('test getBreakTimeSeconds(date) a day before starting at AOK (2021-08-31)', () => {
    const timestamp = globalUtil.getBreakTimeSeconds(moment('2021-08-31'));
    expect(timestamp).to.equal(45 * 60);
  });

  it('test getBreakTimeSeconds(date) a day after starting at AOK (2021-09-01)', () => {
    const timestamp = globalUtil.getBreakTimeSeconds(moment('2021-09-01'));
    expect(timestamp).to.equal(30 * 60);
  });

  it('test getBreakTimeSeconds(date) somwhere in the midst of AOK engagement (2022-03-16)', () => {
    const timestamp = globalUtil.getBreakTimeSeconds(moment('2022-03-16'));
    expect(timestamp).to.equal(30 * 60);
  });

  it('test getBreakTimeSeconds(date) at last day of AOK engagement (2023-09-30)', () => {
    const timestamp = globalUtil.getBreakTimeSeconds(moment('2023-09-30'));
    expect(timestamp).to.equal(30 * 60);
  });

  it('test getBreakTimeSeconds(date) a day after AOK engagement, first day of Baader Bank engagement (2023-10-01) with 5 hours working', () => {
    const timestamp = globalUtil.getBreakTimeSeconds(moment('2023-10-01'), 5);
    expect(timestamp).to.equal(0);
  });

  it('test getBreakTimeSeconds(date) a day after AOK engagement, first day of Baader Bank engagement (2023-10-01) with 8 hours working', () => {
    const timestamp = globalUtil.getBreakTimeSeconds(moment('2023-10-01'), 8);
    expect(timestamp).to.equal(30 * 60);
  });

  it('test getBreakTimeSeconds(date) a day after AOK engagement, first day of Baader Bank engagement (2023-10-01) with 9.8 hours working', () => {
    const timestamp = globalUtil.getBreakTimeSeconds(moment('2023-10-01'), 9.8);
    expect(timestamp).to.equal(45 * 60);
  });

  it('test getBreakTimeSeconds(date) somewhere in the future (2024-01-01)', () => {
    const timestamp = globalUtil.getBreakTimeSeconds(moment('2024-01-01'));
    expect(timestamp).to.equal(30 * 60);
  });

  it('getBreakTimeMilliSeconds before AOK', async () => {
    const result = await globalUtil.getBreakTimeMilliSeconds(TIME_BEFORE_AOK);
    expect(result).to.equal(45 * 60 * 1000); // default time before AOK
  });
  it('getBreakTimeMilliSeconds during AOK', async () => {
    const result = await globalUtil.getBreakTimeMilliSeconds(TIME_DURING_AOK);
    expect(result).to.equal(30 * 60 * 1000); // time during AOK
  });
  it('getBreakTimeMilliSeconds with invalid date (-> default)', async () => {
    const result = await globalUtil.getBreakTimeMilliSeconds();
    expect(result).to.equal(45 * 60 * 1000); // default
  });

  it('test getBreakTimeMilliSeconds(date) with date in the past before AOK (1970-01-01)', () => {
    const timestamp = globalUtil.getBreakTimeMilliSeconds(moment('1970-01-01'));
    expect(timestamp).to.equal(45 * 60 * 1000);
  });

  it('test getBreakTimeMilliSeconds(date) a day before starting at AOK (2021-08-31)', () => {
    const timestamp = globalUtil.getBreakTimeMilliSeconds(moment('2021-08-31'));
    expect(timestamp).to.equal(45 * 60 * 1000);
  });

  it('test getBreakTimeMilliSeconds(date) a day after starting at AOK (2021-09-01)', () => {
    const timestamp = globalUtil.getBreakTimeMilliSeconds(moment('2021-09-01'));
    expect(timestamp).to.equal(30 * 60 * 1000);
  });

  it('test getBreakTimeMilliSeconds(date) somwhere in the midst of AOK engagement (2022-03-16)', () => {
    const timestamp = globalUtil.getBreakTimeMilliSeconds(moment('2022-03-16'));
    expect(timestamp).to.equal(30 * 60 * 1000);
  });

  it('test getBreakTimeMilliSeconds(date) at last day of AOK engagement (2023-09-30)', () => {
    const timestamp = globalUtil.getBreakTimeMilliSeconds(moment('2023-09-30'));
    expect(timestamp).to.equal(30 * 60 * 1000);
  });

  it('test getBreakTimeMilliSeconds(date) a day after AOK engagement (2023-10-01)', () => {
    const timestamp = globalUtil.getBreakTimeMilliSeconds(moment('2023-10-01'));
    expect(timestamp).to.equal(30 * 60 * 1000);
  });

  it('test getBreakTimeMilliSeconds(date) somewhere in the future (2024-01-01) 5 hours', () => {
    const timestamp = globalUtil.getBreakTimeMilliSeconds(moment('2024-01-01'), 5);
    expect(timestamp).to.equal(0);
  });
  it('test getBreakTimeMilliSeconds(date) somewhere in the future (2024-01-01)', () => {
    const timestamp = globalUtil.getBreakTimeMilliSeconds(moment('2024-01-01'));
    expect(timestamp).to.equal(30 * 60 * 1000);
  });
  it('test getBreakTimeMilliSeconds(date) somewhere in the future (2024-01-01) 9 hours', () => {
    const timestamp = globalUtil.getBreakTimeMilliSeconds(moment('2024-01-01'), 9);
    expect(timestamp).to.equal(30 * 60 * 1000);
  });
  it('test getBreakTimeMilliSeconds(date) somewhere in the future (2024-01-01) 9.5 hours', () => {
    const timestamp = globalUtil.getBreakTimeMilliSeconds(moment('2024-01-01'), 9.5);
    expect(timestamp).to.equal(45 * 60 * 1000);
  });
});

describe('test g_util.getBookedTimeMilliSeconds...', () => {
  it('getBookedTimeMilliSeconds before AOK with 2 entries', async () => {
    const result = await globalUtil.getBookedTimeMilliSeconds(100000, 5000, moment('2018-02-01').unix(), 2);
    expect(result).to.equal(100000 - 5000); // default time before AOK
  });
  it('getBookedTimeMilliSeconds before AOK with 4 entries', async () => {
    const result = await globalUtil.getBookedTimeMilliSeconds(95000, 5000, moment('2018-02-01').unix(), 4);
    expect(result).to.equal(100000 - 5000); // default time before AOK
  });
  it('getBookedTimeMilliSeconds after AOK with 2 entries', async () => {
    const result = await globalUtil.getBookedTimeMilliSeconds(100000, 5000, moment('2022-02-01').unix(), 2);
    expect(result).to.equal(100000 - 5000 + 504 * 60); // default time before AOK
  });
  it('getBookedTimeMilliSeconds after AOK with 4 entries', async () => {
    const result = await globalUtil.getBookedTimeMilliSeconds(100000, 5000, moment('2022-02-01').unix(), 4);
    expect(result).to.equal(100000 + 504 * 60); // default time before AOK
  });
});

describe('test global_util break time', () => {
  it('Consorsbank: getBreakTimeSeconds               -> expect 60', async () => {
    const breakTime = await globalUtil.getBreakTimeSeconds(1577185859);
    expect(breakTime).to.equal(45 * 60);
  });
  it('AOK:         getBreakTimeSeconds               -> expect 45', async () => {
    const breakTime = await globalUtil.getBreakTimeSeconds(1640344259);
    expect(breakTime).to.equal(30 * 60);
  });
  it('Baader Bank: getBreakTimeSeconds <6 hours      -> expect 0', async () => {
    const breakTime = await globalUtil.getBreakTimeSeconds(1735040291, 5);
    expect(breakTime).to.equal(0);
  });
  it('Baader Bank: getBreakTimeSeconds 6 hours       -> expect 0', async () => {
    const breakTime = await globalUtil.getBreakTimeSeconds(1735040291, 6);
    expect(breakTime).to.equal(0 * 60);
  });
  it('Baader Bank: getBreakTimeSeconds 7 hours (6-8) -> expect 30', async () => {
    const breakTime = await globalUtil.getBreakTimeSeconds(1735040291, 7);
    expect(breakTime).to.equal(30 * 60);
  });
  it('Baader Bank: getBreakTimeSeconds 8 hours       -> expect 30', async () => {
    const breakTime = await globalUtil.getBreakTimeSeconds(1735040291, 8);
    expect(breakTime).to.equal(30 * 60);
  });
  it('Baader Bank: getBreakTimeSeconds               -> expect 30', async () => {
    const breakTime = await globalUtil.getBreakTimeSeconds(1735040291);
    expect(breakTime).to.equal(30 * 60);
  });
  it('Baader Bank: getBreakTimeSeconds >8 hours (9)  -> expect 30', async () => {
    const breakTime = await globalUtil.getBreakTimeSeconds(1735040291, 9);
    expect(breakTime).to.equal(30 * 60);
  });
  it('Baader Bank: getBreakTimeSeconds >9            -> expect 45', async () => {
    const breakTime = await globalUtil.getBreakTimeSeconds(1735040291, 9);
    expect(breakTime).to.equal(30 * 60);
  });
  it('Baader Bank: getBreakTimeMilliSeconds          -> expect 30', async () => {
    const breakTime = await globalUtil.getBreakTimeMilliSeconds(1735040291);
    expect(breakTime).to.equal(30 * 60 * 1000);
  });
});

describe('test global_util getBookedTimeMilliSeconds', () => {
  it('Consorsbank: getBookedTimeMilliSeconds (0 entries) -> expect 21600', async () => {
    const bookedTime = await globalUtil.getBookedTimeMilliSeconds(6 * 60 * 60, 45 * 60, 1577185859, 0);
    expect(bookedTime).to.equal(6 * 60 * 60 - 45 * 60);
  });
  it('Consorsbank: getBookedTimeMilliSeconds (2 entries) -> expect 21600', async () => {
    const bookedTime = await globalUtil.getBookedTimeMilliSeconds(6 * 60 * 60, 45 * 60, 1577185859, 2);
    expect(bookedTime).to.equal(6 * 60 * 60 - 45 * 60);
  });
  it('Consorsbank: getBookedTimeMilliSeconds (3 entrie   -> expect 21600', async () => {
    const bookedTime = await globalUtil.getBookedTimeMilliSeconds(6 * 60 * 60, 45 * 60, 1577185859, 3);
    expect(bookedTime).to.equal(6 * 60 * 60);
  });
  it('AOK: getBookedTimeMilliSeconds (1 entries)         -> expect 21600', async () => {
    const bookedTime = await globalUtil.getBookedTimeMilliSeconds(6 * 60 * 60, 45 * 60, 1577185859, 1);
    expect(bookedTime).to.equal(18900);
  });
  it('AOK: getBookedTimeMilliSeconds (2 entries)         -> expect 21600', async () => {
    const bookedTime = await globalUtil.getBookedTimeMilliSeconds(6 * 60 * 60, 45 * 60, 1577185859, 2);
    expect(bookedTime).to.equal(18900);
  });
  it('AOK: getBookedTimeMilliSeconds (3 entries)         -> expect 21600', async () => {
    const bookedTime = await globalUtil.getBookedTimeMilliSeconds(6 * 60 * 60, 45 * 60, 1577185859, 3);
    expect(bookedTime).to.equal(6 * 60 * 60);
  });
  it('Baader Bank getBookedTimeMilliSeconds (0 entries)  -> expect 21600', async () => {
    const bookedTime = await globalUtil.getBookedTimeMilliSeconds(6 * 60 * 60, 45 * 60, 1735040291, 0);
    expect(bookedTime).to.equal(6 * 60 * 60 - 45 * 60);
  });
  it('Baader Bank getBookedTimeMilliSeconds (2 entries)  -> expect 21600', async () => {
    const bookedTime = await globalUtil.getBookedTimeMilliSeconds(6 * 60 * 60, 45 * 60, 1735040291, 2);
    expect(bookedTime).to.equal(6 * 60 * 60 - 45 * 60);
  });
  it('Baader Bank getBookedTimeMilliSeconds (0 entries)  -> expect 21600', async () => {
    const bookedTime = await globalUtil.getBookedTimeMilliSeconds(6 * 60 * 60, 45 * 60, 1735040291, 0);
    expect(bookedTime).to.equal(6 * 60 * 60 - 45 * 60);
  });
  it('Baader Bank getBookedTimeMilliSeconds (2 entries)  -> expect 21600', async () => {
    const bookedTime = await globalUtil.getBookedTimeMilliSeconds(6 * 60 * 60, 45 * 60, 1735040291, 2);
    expect(bookedTime).to.equal(6 * 60 * 60 - 45 * 60);
  });
  it('Baader Bank getBookedTimeMilliSeconds (3 entries)  -> expect 21600', async () => {
    const bookedTime = await globalUtil.getBookedTimeMilliSeconds(6 * 60 * 60, 45 * 60, 1735040291, 3);
    expect(bookedTime).to.equal(6 * 60 * 60);
  });
});
