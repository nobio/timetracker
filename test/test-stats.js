require("../db/db");
const fs = require("fs");
const mongoose = require("mongoose");
const TimeEntry = mongoose.model("TimeEntry");
const util = require("../routes/stats/util-stats");
const utilTimeEntry = require("../routes/entries/util-entries");

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

const expect = chai.expect;
const assert = chai.assert;
const should = chai.should;

const moment = require("moment");
require("moment-timezone");
const DEFAULT_DATE = moment("1967-03-16");

/***************************************************************/
/***************************************************************/

describe("test util.getFirstTimeEntry/getLastTimeEntry - Promise", () => {
  var db;
  before(function() {
    db = require("../db/db");
  });

  it("getFirstTimeEntry", async () => {
    await util
      .getFirstTimeEntry()
      .then(result => {
        expect(result).to.have.property("_id");
        expect(result).to.have.property("age");
      })
      .catch(err => {
        throw err;
      });
  });

  it("getLastTimeEntry", async () => {
    await util
      .getLastTimeEntry()
      .then(result => {
        expect(result).to.have.property("_id");
        expect(result).to.have.property("age");
      })
      .catch(err => {
        throw err;
      });
  });

  after(function() {
    //db.closeConnection()
  });
});

describe("test util.removeDoublets - Promise", () => {
  var db;
  before(function() {
    db = require("../db/db");
  });

  it("test for doubletts (should be no in)", async () => {
    await util.removeDoublets()
      .then(result => {
        //console.log(result)
        expect(result).to.have.property("removed");
        expect(result.removed).to.equal(0);
      })
      .catch(err => {
        throw err;
      });
  });

  it("add a doublette and check if one has been removed", async () => {
    await createTimeEntry({ direction: "go", datetime: DEFAULT_DATE })
      .then(result => createTimeEntry({ direction: "go", datetime: DEFAULT_DATE }))
      .then(result => util.removeDoublets())
      .then(result => {
        expect(result).to.have.property("removed");
        expect(result.removed).to.equal(1);
      })
      .catch(err => {
        throw err;
      });
  });

  after(function() {
    clearAllEntries(DEFAULT_DATE);
    setTimeout(function() {
      db.closeConnection();
    }, 1000);
  });
});


// ========================================================================================================
/**
 * create a new TimeEntry regardless other entries. No checks will be performed
 */
function createTimeEntry(timeEntry) {
  // console.log('entered save ' + id)
  return new Promise((resolve, reject) => {
    new TimeEntry({
      entry_date: timeEntry.datetime,
      direction: timeEntry.direction,
      longitude: timeEntry.longitude,
      latitude: timeEntry.latitude,
      signature: 'HARD_CODED'
    }).save()
    .then(timeEntry => resolve(timeEntry))
    .catch(err => reject(err));
  });
}

/**
 *
 * @param {*} date date to delete all entries which might have stayed because of any error
 */
function clearAllEntries(dt) {
  utilTimeEntry.getAllByDate(dt).then(timeentries => {
    console.log("removing " + timeentries.length + " entries");
    timeentries.forEach(timeentry => {
        utilTimeEntry.deleteById(timeentry._id);
    });
  });
}
// ========================================================================================================
