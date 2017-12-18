require('../db/db')
const mongoose = require('mongoose')
const TimeEntry = mongoose.model('TimeEntry')
const util = require('../routes/promise_based/util-entries')

const chai = require('chai')
const chaiAsPromised = require('chai-as-promised')
chai.use(chaiAsPromised)

const expect = chai.expect
const assert = chai.assert

const should = chai.should()

const moment = require('moment')
require('moment-timezone')
const DEFAULT_DATE = moment('1967-03-16')

describe('isEmpty - Promise', () => {
  var testv
  it('should return false when the value is a string', () => {
    testv = util.isEmpty('Test')
    expect(testv).to.be.false
  })
  it('should return true when the value is a numeric value', () => {
    testv = util.isEmpty(123)
    expect(testv).to.be.true
  })
  it('should return true when the value is a boolean value', () => {
    testv = util.isEmpty(true)
    expect(testv).to.be.true
    testv = util.isEmpty(false)
    expect(testv).to.be.true
  })
  it('should return true when the value is emtpy value', () => {
    testv = util.isEmpty()
    expect(testv).to.be.true
  })
  it('should return true when the value is undefined value', () => {
    testv = util.isEmpty(undefined)
    expect(testv).to.be.true
  })
  it('should return false when the value is an array', () => {
    testv = util.isEmpty(['a', 'b'])
    expect(testv).to.be.false
  })
})

describe('test stripdownToDateBerlin method', () => {
  it('should remove time component', () => {
    return util.stripdownToDateBerlin(1393455600031).format('HH:mm:ss').should.equal('00:00:00')
  })
  it('should have date component', () => {
    return util.stripdownToDateBerlin(1000000000000).format('YYYY-MM-DD').should.equal('2001-09-09')
  })
  it('should have date Europe/Berlin timezone', () => {
    return util.stripdownToDateBerlin(1000000000000)._z.name.should.equal('Europe/Berlin')
  })
  it('should parse timestamp 0', () => {
    return util.stripdownToDateBerlin(0).format('YYYY-MM-DD HH:mm:ss').should.equal('1970-01-01 00:00:00')
  })
  it('should parse negative timestamp to timestamp 0', () => {
    return util.stripdownToDateBerlin(-999).format('YYYY-MM-DD HH:mm:ss').should.equal('1970-01-01 00:00:00')
  })
})

// assert('foo' !== 'bar', 'foo is not bar')
// assert(Array.isArray([]), 'empty arrays are arrays')
describe('test util.getBusyTime - Promise', () => {
  var db
  before(function () {
    db = require('../db/db')
  })

  it('response array should have length of 0', () => {
    return util.getAllByDate(-1).should.eventually.have.length(0)
  })
  it('response array should have length of 2', () => {
    return util.getAllByDate(1393455600000).should.eventually.have.length(2)
  })
  it('response array should have length of 0', () => {
    return util.getAllByDate(1000000000000).should.eventually.have.length(0)
  })
  it('response array should have length of 0', () => {
    return util.getAllByDate(0).should.eventually.have.length(0)
  })

  after(function () {
    // db.closeConnection()
  })
})

describe('test find one TimeEntry by its id:  -> util.findById() - Promise', () => {
  var db
  before(function () {
    db = require('../db/db')
  })

  it('should find one Time Entry by its id', async () => {
    //util.findById('5a2100cf87f1f368d087696a').then(timeentry => console.log(timeentry))
    await util.findById('5a2100cf87f1f368d087696a')
    .then(timeentry => {
      //console.log(timeentry)
      expect(timeentry).to.have.property('_id')
      expect(timeentry).to.have.property('direction')
      expect(timeentry).to.have.property('longitude')
      expect(timeentry).to.have.property('latitude')
      expect(timeentry).to.have.property('__v')
      expect(timeentry).to.have.property('direction')
      expect(timeentry.direction).to.equal('enter')
      expect(timeentry).to.have.property('last_changed')
      expect(timeentry).to.have.property('entry_date')
    })
    .catch(err => {throw err})
  })
  it('should not find a Time Entry by an invalid id', () => {
    return util.findById('********_invalid-id_********').should.be.rejectedWith(Error)
  })

  after(function () {
    // db.closeConnection()
  })
})

describe('test to create one TimeEntry:  -> util.create() - Promise', () => {
  var db
  before(function () {
    db = require('../db/db')
  })

  it('create successfully a new TimeEntry', async () => {
    await util.create('enter', DEFAULT_DATE)
      .then(timeEntry => {
        //console.log(timeEntry)
        expect(timeEntry).to.not.be.undefined
        expect(timeEntry).to.have.property('_id')
        expect(timeEntry._id).to.not.be.empty
        expect(timeEntry._id).to.not.be.a('string')
        expect(timeEntry).to.have.property('__v')
        expect(timeEntry).to.have.property('last_changed')
        expect(timeEntry).to.have.property('entry_date')
        expect(moment(timeEntry.entry_date).format('YYYY-MM-DD')).to.equal('1967-03-16')
        expect(timeEntry).to.have.property('longitude')
        expect(timeEntry).to.have.property('latitude')
        expect(timeEntry).to.have.property('direction')
        expect(timeEntry.direction).to.equal('enter')

        return timeEntry._id
      })
      .then(util.findById)
      .then(timeEntry => {
        expect(timeEntry).to.not.be.null

        return timeEntry._id
      })
      .then(util.deleteById)  // delete entry and prove so
      .then(timeEntry => {
        return timeEntry._id
      })
      .then(util.findById)
      .then(timeEntry => {
        expect(timeEntry).to.be.null
      })
      .catch(err => {
        console.log('no error should occure; instead: ' + err.message)
        clearAllEntries()        
        throw err
      })
  })

  it('create successfully a new TimeEntry without datetime', async () => {
    await util.create('enter')
      .then(timeEntry => {
        //console.log(timeEntry)
        expect(timeEntry).to.not.be.undefined
        expect(timeEntry).to.have.property('_id')
        expect(timeEntry._id).to.not.be.empty
        expect(timeEntry._id).to.not.be.a('string')
        expect(timeEntry).to.have.property('__v')
        expect(timeEntry).to.have.property('last_changed')
        expect(timeEntry).to.have.property('entry_date')
        expect(moment(timeEntry.entry_date).format('YYYY-MM-DD')).to.equal(moment().format('YYYY-MM-DD'))
        expect(timeEntry).to.have.property('latitude')
        expect(timeEntry).to.have.property('longitude')
        expect(timeEntry).to.have.property('direction')
        expect(timeEntry.direction).to.equal('enter')

        return timeEntry._id
      })
      .then(util.findById)
      .then(timeEntry => {
        expect(timeEntry).to.not.be.null

        return timeEntry._id
      })
      .then(util.deleteById)  // delete entry and prove so
      .then(timeEntry => {
        return timeEntry._id
      })
      .then(util.findById)
      .then(timeEntry => {
        expect(timeEntry).to.be.null
      })
      .catch(err => {
        clearAllEntries()        
        throw err
      })
  })

})

describe('test delete one TimeEntry by its id:  -> util.deleteById() - Promise', () => {
  var db
  before(function () {
    db = require('../db/db')
  })

  it('should delete one Time Entry by its id', async () => {
    // create new entry (which will be deleted later)
    await util.create('enter', DEFAULT_DATE)
      .then(util.deleteById)
      .then(timeEntry => {
        //console.log(timeEntry)
        expect(timeEntry).to.not.be.undefined
        expect(timeEntry).to.have.property('_id')
        expect(timeEntry._id).to.not.be.empty
        expect(timeEntry._id).to.not.be.a('string')
        expect(timeEntry).to.have.property('__v')
        expect(timeEntry).to.have.property('last_changed')
        expect(timeEntry).to.have.property('entry_date')
        expect(timeEntry).to.have.property('direction')
        expect(timeEntry.direction).to.equal('enter')
        expect(moment(timeEntry.entry_date).format('YYYY-MM-DD')).to.equal('1967-03-16')
        expect(timeEntry).to.have.property('longitude')

        return timeEntry._id
      })
      .then(util.findById)
      .then(timeEntry => {
        expect(timeEntry).to.be.null
      })
      .catch(err => {
        clearAllEntries()        
        throw err
      })
  })

})

describe('test to modify one TimeEntry:  -> util.update() - Promise', () => {
  var db
  before(function () {
    db = require('../db/db')
  })

  it('modify successfully a new TimeEntry', async () => {
    await util.create('enter', DEFAULT_DATE)
      .then(timeEntry => {
//        console.log(timeEntry)        
        expect(timeEntry).to.not.be.undefined
        expect(timeEntry).to.have.property('_id')
        expect(timeEntry._id).to.not.be.empty
        expect(timeEntry._id).to.not.be.a('string')
        expect(timeEntry).to.have.property('__v')
        expect(timeEntry).to.have.property('last_changed')
        expect(timeEntry).to.have.property('entry_date')
        expect(timeEntry).to.have.property('direction')
        expect(timeEntry.direction).to.equal('enter')
        expect(moment(timeEntry.entry_date).format('YYYY-MM-DD')).to.equal('1967-03-16')
        expect(timeEntry).to.have.property('longitude')

        timeEntry.direction = 'go'
        return timeEntry
      })
      .then(util.update)
      .then(timeEntry => {
        expect(timeEntry).to.not.be.null
        expect(timeEntry).to.not.be.undefined
        expect(timeEntry).to.have.property('_id')
        expect(timeEntry._id).to.not.be.empty
        expect(timeEntry._id).to.not.be.a('string')
        expect(timeEntry).to.have.property('__v')
        expect(timeEntry).to.have.property('last_changed')
        expect(timeEntry).to.have.property('entry_date')
        expect(timeEntry).to.have.property('direction')
        expect(timeEntry.direction).to.equal('go')
        expect(moment(timeEntry.entry_date).format('YYYY-MM-DD')).to.equal('1967-03-16')
        expect(timeEntry).to.have.property('longitude')
        return timeEntry._id
      })
      .then(util.findById)
      .then(timeEntry => {
        //console.log(timeEntry)
        expect(timeEntry).to.not.be.undefined
        expect(timeEntry).to.have.property('_id')
        expect(timeEntry._id).to.not.be.empty
        expect(timeEntry._id).to.not.be.a('string')
        expect(timeEntry).to.have.property('__v')
        expect(timeEntry).to.have.property('last_changed')
        expect(timeEntry).to.have.property('entry_date')
        expect(timeEntry).to.have.property('direction')
        expect(timeEntry.direction).to.equal('go')
        expect(moment(timeEntry.entry_date).format('YYYY-MM-DD')).to.equal('1967-03-16')
        expect(timeEntry).to.have.property('longitude')

        return timeEntry._id        
      })
      .then(util.deleteById)  // delete entry and prove so
      .then(timeEntry => {
        return timeEntry._id
      })
      .then(util.findById)
      .then(timeEntry => {
        expect(timeEntry).to.be.null
      })
      .catch(err => {
        throw err
      })
  })

  after(function () {
    setTimeout(function () {
      db.closeConnection()
      callback()
    }, 1000)
  })
})

/**
 * 
 * @param {*} date date to delete all entries which might have stayed because of any error
 */
function clearAllEntries() {
  util.getAllByDate(DEFAULT_DATE)
  .then(timeentries => {
    console.log('removing ' + timeentries.length + ' entries')
    timeentries.forEach((timeentry) => {
      util.deleteById(timeentry._id)
  });
}) 
}