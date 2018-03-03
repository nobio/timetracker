require("../db/db");
const fs = require("fs");
const mongoose = require("mongoose");
const TimeEntry = mongoose.model("TimeEntry");
const util = require("../routes/stats/util-stats");

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

const expect = chai.expect;
const assert = chai.assert;
const should = chai.should;

const moment = require("moment");
require("moment-timezone");

/***************************************************************/
/***************************************************************/

describe("test util.getFirstTimeEntry - Promise", () => {
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
