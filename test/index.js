var db = require("../db");
var util = require("../routes/util");
var expect = require("chai").expect;

console.log("testing a lot stuff...");

describe("Util Functions", function() {
    it("test isEmpty functions", function() {
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
    });
    
    it("test BusytimyByDate", function() {
        util.getBusytimeByDate(1393455600000, function(err, timeentries) {
            console.log(">> " + err);
            console.log(">> " + timeentries);
        });
    });

});

//db.shutdown();

