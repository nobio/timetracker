//const db = require("../db");
const util = require("../routes/util");
const admin = require("../routes/admin");
const route = require("../routes/index");

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

const expect = chai.expect;
const assert = chai.assert;
chai.should();

describe('isEmpty', () => {
    var testv;
    it('should return false when the value is a string', () => {
        testv = util.isEmpty("Test");
        expect(testv).to.be.false;
    });
    it('should return true when the value is a numeric value', () => {
        testv = util.isEmpty(123);
        expect(testv).to.be.true;
    });
    it('should return true when the value is a boolean value', () => {
        testv = util.isEmpty(true);
        expect(testv).to.be.true;
        testv = util.isEmpty(false);
        expect(testv).to.be.true;
    });
    it('should return true when the value is emtpy value', () => {
        testv = util.isEmpty();
        expect(testv).to.be.true;
    });
    it('should return true when the value is undefined value', () => {
        testv = util.isEmpty(undefined);
        expect(testv).to.be.true;
    });
    it('should return false when the value is an array', () => {
        testv = util.isEmpty(["a", "b"]);
        expect(testv).to.be.false;
    });
});
//assert('foo' !== 'bar', 'foo is not bar');
//assert(Array.isArray([]), 'empty arrays are arrays');
describe('test util.getBusytimeByDate()', () => {
    var db;
    before(function() {
        console.log('BEFORE');
        db = require("../db");
    });
    it('response array should have length of 0', () => {
        return util.getTimeEntriesByDatePromise(-1).should.eventually.have.length(0);
    });
    it('response array should have length of 2', () => {
        return util.getTimeEntriesByDatePromise(1393455600000).should.eventually.have.length(2);
    });
    it('response array should have length of 0', () => {
        return util.getTimeEntriesByDatePromise(0).should.eventually.have.length(0);
    });

    after(function() {
        console.log('AFTER');
        db.closeConnection();
    });
});
describe('test creation of new entry: post /entries -> util.createTimeEntry()', () => {
    var db;
    before(function() {
        //console.log('BEFORE');
        db = require("../db");
    });
    it('response array should have length of 0', () => {
        return util.createTimeEntry();
    });

    after(function() {
        //console.log('AFTER');
        db.closeConnection();
    });
});
