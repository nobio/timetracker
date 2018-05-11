const mongoose = require('mongoose');
const moment = require('moment');
const tz = require('moment-timezone');
const util = require('./entries/util-entries');

const TimeEntry = mongoose.model('TimeEntry');

/* ================================================================== */
/* =========================== JADE/HTML ============================ */
/* ================================================================== */

/*
 * calculates the number of entries and renders the index.jade by passing the size
 */
exports.index = (req, res) => {
  util.count()
    .then((size) => {
      res.render('index', {size});
    })
    .catch((err) => {
      console.error(err)
      res.render('index');
    });
};

exports.admin = (req, res) => {
  res.render('admin');
};

exports.admin_item = (req, res) => {
  res.render('admin_item');
  // http://localhost:30000/admin_item?id=537edec991c647b10f4f5a6f
};

exports.stats = (req, res) => {
  res.render('stats');
};

exports.statistics = (req, res) => {
  res.render('statistics');
};

exports.geoloc = (req, res) => {
  res.render('geoloc');
};
