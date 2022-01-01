const fs = require('fs');

const util = require('../api/admin/util-admin');

const chai = require('chai');
const chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

const expect = chai.expect;

require('moment-timezone');

/** ************************************************************ */
const rmDir = function (dirPath, removeSelf) {
  let files;
  let bRemoveSelf = removeSelf;
  if (removeSelf === undefined) {
    bRemoveSelf = true;
  }

  try {
    files = fs.readdirSync(dirPath);
  } catch (e) {
    return;
  }

  if (files.length > 0) {
    for (let i = 0; i < files.length; i++) {
      const filePath = `${dirPath}/${files[i]}`;
      if (fs.statSync(filePath).isFile()) fs.unlinkSync(filePath);
      else rmDir(filePath);
    }
  }
  if (bRemoveSelf) fs.rmdirSync(dirPath);
};
/** ************************************************************ */


describe('test util.dumpTimeEnties', () => {
  before(() => {
    rmDir('./dump');
  });

  it('dumping the database should lead to a new file in /dump', async () => {
    try {
      const result = await util.dumpTimeEntries();
      console.log(result)
      expect(result).to.have.property('size');
      expect(result).to.have.property('filename');
      const data = fs.readFileSync(result.filename);
      expect(data).to.not.be.empty;
    } catch (error) {
      throw error;
    }
  }).timeout(10000);
});
