require('./init');
const moment = require('moment');
const Chai = require('chai');
const Mocha = require('mocha');
const chaiAsPromised = require('chai-as-promised');
const sinonChai = require('sinon-chai');

Chai.use(chaiAsPromised);
Chai.use(sinonChai);

const { expect } = Chai;
const { describe, it } = Mocha;
const globalUtil = require('../api/global_util');

describe('test global_util.getBreakTimeSeconds', () => {
  it('test getBreakTimeSeconds(date) with date in the past before AOK (1970-01-01)', () => {
    const timestamp = globalUtil.getBreakTimeSeconds(moment('1970-01-01'));
    expect(timestamp).to.equal(2700);
  });

  it('test getBreakTimeSeconds(date) a day before starting at AOK (2021-08-31)', () => {
    const timestamp = globalUtil.getBreakTimeSeconds(moment('2021-08-31'));
    expect(timestamp).to.equal(2700);
  });

  it('test getBreakTimeSeconds(date) a day after starting at AOK (2021-09-01)', () => {
    const timestamp = globalUtil.getBreakTimeSeconds(moment('2021-09-01'));
    expect(timestamp).to.equal(1800);
  });

  it('test getBreakTimeSeconds(date) somwhere in the midst of AOK engagement (2022-03-16)', () => {
    const timestamp = globalUtil.getBreakTimeSeconds(moment('2022-03-16'));
    expect(timestamp).to.equal(1800);
  });

  it('test getBreakTimeSeconds(date) at last day of AOK engagement (2023-09-30)', () => {
    const timestamp = globalUtil.getBreakTimeSeconds(moment('2023-09-30'));
    expect(timestamp).to.equal(1800);
  });

  it('test getBreakTimeSeconds(date) a day after AOK engagement (2023-10-01)', () => {
    const timestamp = globalUtil.getBreakTimeSeconds(moment('2023-10-01'));
    expect(timestamp).to.equal(2700);
  });

  it('test getBreakTimeSeconds(date) somewhere in the future (2024-01-01)', () => {
    const timestamp = globalUtil.getBreakTimeSeconds(moment('2024-01-01'));
    expect(timestamp).to.equal(2700);
  });
});

describe('test global_util.getBreakTimeMilliSeconds', () => {
  it('test getBreakTimeMilliSeconds(date) with date in the past before AOK (1970-01-01)', () => {
    const timestamp = globalUtil.getBreakTimeMilliSeconds(moment('1970-01-01'));
    expect(timestamp).to.equal(2700000);
  });

  it('test getBreakTimeMilliSeconds(date) a day before starting at AOK (2021-08-31)', () => {
    const timestamp = globalUtil.getBreakTimeMilliSeconds(moment('2021-08-31'));
    expect(timestamp).to.equal(2700000);
  });

  it('test getBreakTimeMilliSeconds(date) a day after starting at AOK (2021-09-01)', () => {
    const timestamp = globalUtil.getBreakTimeMilliSeconds(moment('2021-09-01'));
    expect(timestamp).to.equal(1800000);
  });

  it('test getBreakTimeMilliSeconds(date) somwhere in the midst of AOK engagement (2022-03-16)', () => {
    const timestamp = globalUtil.getBreakTimeMilliSeconds(moment('2022-03-16'));
    expect(timestamp).to.equal(1800000);
  });

  it('test getBreakTimeMilliSeconds(date) at last day of AOK engagement (2023-09-30)', () => {
    const timestamp = globalUtil.getBreakTimeMilliSeconds(moment('2023-09-30'));
    expect(timestamp).to.equal(1800000);
  });

  it('test getBreakTimeMilliSeconds(date) a day after AOK engagement (2023-10-01)', () => {
    const timestamp = globalUtil.getBreakTimeMilliSeconds(moment('2023-10-01'));
    expect(timestamp).to.equal(2700000);
  });

  it('test getBreakTimeMilliSeconds(date) somewhere in the future (2024-01-01)', () => {
    const timestamp = globalUtil.getBreakTimeMilliSeconds(moment('2024-01-01'));
    expect(timestamp).to.equal(2700000);
  });
});
