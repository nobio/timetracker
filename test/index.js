var db = require("../db");
var util = require("../routes/util");
var util = require("../routes/util");
var util = require("../routes/util");
var admin = require("../routes/admin");
var route = require("../routes/index");

var expect = require("chai").expect;
var assert = require("chai").assert;

console.log("\n=============================================\ntesting a lot stuff...");

var testv = util.isEmpty("Test");
expect(testv).to.be.false;
testv = util.isEmpty(123);
expect(testv).to.be.true;
testv = util.isEmpty(true);
expect(testv).to.be.true;
testv = util.isEmpty();
expect(testv).to.be.true;
testv = util.isEmpty(undefined);
expect(testv).to.be.true;
testv = util.isEmpty(["a", "b"]);
expect(testv).to.be.false;
expect(true).to.be.true;
assert('foo' !== 'bar', 'foo is not bar');
assert(Array.isArray([]), 'empty arrays are arrays');

util.createTimeEntry('enter', 0, 0, )

util.getBusytimeByDate(1393455600000, function (err, timeentries) {
    console.log(">> " + err);
    console.log(">> " + timeentries);
    expect(err).to.be.null;
});
console.log("\n=============================================\n");
util.getTimeEntriesByDatePromise(-1393455600000)
.then(timeentries => { 
    expect(timeentries).empty;
})
.catch(err => {
    console.log(err);
});

util.getTimeEntriesByDatePromise(-1393455600000).then(
    (timeentries) => {expect(timeentries).empty},
    (err) => {console.log(err)}
);