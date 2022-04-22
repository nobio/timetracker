require('./init');
const db = require('../db');
const cache = require('../db/cache');
const mongoose = require('mongoose');
const Toggle = mongoose.model('Toggle');

const chai = require('chai');
const expect = chai.expect;
const assert = chai.assert;

describe('test Cache', () => {
  after(async () => {
    await Toggle.deleteMany({ name: '__test__' });
  });

  before(() => {
  });

  it('testing cache without expire time (reading)', async () => {
    try {
      const toggles = await Toggle.find().cache()
      //console.log(toggles)
      expect(toggles).to.be.an('array');
      expect(toggles.length).to.be.greaterThan(0);
    } catch (error) {
      console.log(error);
      assert.fail('should not throw exception')
    }
  });
  it('testing cache with expire time 10 (reading)', async () => {
    try {
      const toggles = await Toggle.find().cache(10)
      expect(toggles).to.be.an('array');
      expect(toggles.length).to.be.greaterThan(0);
    } catch (error) {
      console.log(error);
      assert.fail('should not throw exception')
    }
  });
  it('testing cache with expire time 10 (reading)', async () => {
    try {
      const toggles = await Toggle.find();
      expect(toggles).to.be.an('array');
      expect(toggles[0]).to.have.property('_id');
      const ID = toggles[0]._id;

      let toggle = await Toggle.findById(ID);

      expect(toggles[0].id).to.equal(toggle.id);
      toggle = await Toggle.findById(ID).cache();
      expect(toggles[0].id).to.equal(toggle.id);
      toggle = await Toggle.findById(ID).cache(5);
      expect(toggles[0].id).to.equal(toggle.id);
    } catch (error) {
      console.log(error); s
      assert.fail('should not throw exception')
    }
  });
  it.only('testing cache while storeing data (invalidating cache)', async () => {
    try {
      await Toggle.deleteMany({ name: '__test__' });


      const toggles = await Toggle.find().cache(60);

      const toggle = await new Toggle({
        name: '__test__',
        toggle: true,
        notificaiton: '___delete me!___',
      }).save().invalidate();

      const toggles2 = await Toggle.find().cache(60);

      console.log(toggles.length, toggles2.length)
      expect(toggles.length).to.be.lessThan(toggles2.length);

      //expect(toggleLength).to.be.lessThan(toggleLength2);
      //await Toggle.findByIdAndRemove(toggle.id);

    } catch (error) {
      console.log(error);
      assert.fail('should not throw exception')
    }
  });
});
