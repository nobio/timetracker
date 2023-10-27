require('./init');
require('../db');
const moment = require('moment');
const mongoose = require('mongoose');
const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');
const sinonChai = require('sinon-chai');
chai.use(chaiAsPromised);
chai.use(sinonChai);

const { expect, describe } = chai;
const g_util = require('../api/global_util');

describe('test global_util.js', () => {
  it('test getBreakTimeSeconds(date)', () => {
    console.log(moment('2023-16-03'))
    const timestamp = g_util.getBreakTimeSeconds(moment())
    console.log(timestamp)
    /*
        expect(gf).to.be.a('array');
        expect(gf.length).to.be.greaterThan(0);
        expect(gf[0]).to.be.a('object');
    
        expect(gf[0]).to.have.property('id');
        expect(gf[0]).to.have.property('enabled');
        expect(gf[0]).to.have.property('longitude');
        expect(gf[0]).to.have.property('latitude');
        expect(gf[0]).to.have.property('radius');
        expect(gf[0]).to.have.property('description');
        expect(gf[0]).to.have.property('isCheckedIn');
        expect(gf[0]).to.have.property('lastChange');
      */
  });
});
