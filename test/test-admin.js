require("../db/db");
const fs = require("fs");
const mongoose = require("mongoose");
const TimeEntry = mongoose.model("TimeEntry");
const TimeEntryBackup = mongoose.model("TimeEntryBackup");
const util = require("../routes/admin/util-admin");

const chai = require("chai");
const chaiAsPromised = require("chai-as-promised");
chai.use(chaiAsPromised);

const expect = chai.expect;
const assert = chai.assert;
const should = chai.should;

const moment = require("moment");
require("moment-timezone");

/***************************************************************/
rmDir = function(dirPath, removeSelf) {
  if (removeSelf === undefined) {
    removeSelf = true;
  }

  try {
    var files = fs.readdirSync(dirPath);
  } catch (e) {
    return;
  }

  if (files.length > 0)
    for (var i = 0; i < files.length; i++) {
      var filePath = dirPath + "/" + files[i];
      if (fs.statSync(filePath).isFile()) fs.unlinkSync(filePath);
      else rmDir(filePath);
    }
  if (removeSelf) fs.rmdirSync(dirPath);
};
/***************************************************************/


describe('test util.dumpTimeEnties - Promise', () => {
  var db
  before(function() {
    db = require('../db/db')
	rmDir('./dump')
  })

  it('dumping the database should lead to a new file in /dump', async () => {
  	await util.dumpTimeEnties()
      .then(result => {
        console.log()
        expect(result).to.have.property('size')
        expect(result).to.have.property('filename')
        return result.filename
      })
      .then(filename => {
      	var data = fs.readFileSync(filename);
      	expect(data).to.not.be.empty
      })
      .catch(err => { throw err })

  })

  after(function() {
    //db.closeConnection()
  })
})

describe("test util.backupTimeEntries - Promise", () => {
  var db;

  before(function() {
    db = require("../db/db");
  });

  it("backing up the productive database into a history-staging table", async () => {
    var countBackups;

    await TimeEntryBackup.find()
      .then(timeEntryBackups => {
        countBackups = timeEntryBackups.length;
      })
      .catch(err => {
        throw err;
      });

    await util
      .backupTimeEntries()
      .then(result => {
        expect(result).to.not.be.undefined;
        expect(result).to.have.property("backup_count");
        expect(result.backup_count).to.equal(countBackups);
      })
      .catch(err => {
        throw err;
      });
  });

  after(function() {
    //db.closeConnection()
  });
});
