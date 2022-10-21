/* eslint-disable object-curly-newline */
const mongoose = require('mongoose');

// --------------------------------------------------
// ----------------- TimeEntry ----------------------
// --------------------------------------------------
const directions = 'enter go'.split(' ');
const TimeEntry = new mongoose.Schema({
  entry_date: {
    type: Date, required: true, default: Date.now, index: true,
  },
  direction: { type: String, enum: directions, required: true },
  last_changed: { type: Date, default: Date.now, required: true },
  longitude: { type: Number, required: false },
  latitude: { type: Number, required: false },
});
module.exports.TimeEntry = TimeEntry;

// --------------------------------------------------
// ------------------ StatisticsDay -----------------
// --------------------------------------------------
const StatsDay = new mongoose.Schema({
  date: {
    type: Date, required: true, default: Date.now, index: true, unique: true,
  },
  actual_working_time: { type: Number, required: true, default: 0 },
  planned_working_time: { type: Number, required: true, default: 0 },
  is_working_day: { type: Boolean, required: true, default: false },
  is_complete: { type: Boolean, required: true },
  last_changed: { type: Date, required: true, default: Date.now },
});
module.exports.StatsDay = StatsDay;

// --------------------------------------------------
// -------------- Notification Toggles --------------
// --------------------------------------------------
const Toggle = new mongoose.Schema({
  name: { type: String, required: true, index: true, unique: true },
  toggle: { type: Boolean, required: true, default: false, index: false },
  notification: { type: String, required: true, default: 'generic message', index: false, unique: false },
});
module.exports.Toggle = Toggle;

// --------------------------------------------------
// ----------------- Properties ---------------------
// --------------------------------------------------
const Properties = new mongoose.Schema({
  key: { type: String, required: true, index: true, unique: true },
  value: { type: String, required: true, index: false, unique: false },
});
module.exports.Properties = Properties;

// --------------------------------------------------
// ------------------ Failure Days ------------------
// --------------------------------------------------
const failureTypes = 'INCOMPLETE,WRONG_ORDER'.split(',');
const FailureDay = new mongoose.Schema({
  date: { type: Date, required: true, index: false, unique: false },
  failure_type: { type: String, enum: failureTypes, required: true, index: false, unique: false },
});
module.exports.FailureDay = FailureDay;

// --------------------------------------------------
// ------------------ Geo Tracking ------------------
// --------------------------------------------------
const GeoTracking = new mongoose.Schema({
  longitude: { type: Number, required: true, index: true },
  latitude: { type: Number, required: true, index: true },
  accuracy: { type: Number, required: false },
  source: { type: String, required: true },
  altitude: { type: String, required: false },
  date: { type: Date, required: true, index: true, unique: true, default: Date.now },
});
module.exports.GeoTracking = GeoTracking;

// --------------------------------------------------
// -------------- Users -------------- --------------
// --------------------------------------------------
const User = new mongoose.Schema({
  username: { type: String, required: true, index: true, unique: true },
  password: { type: String, required: true, default: false, index: false },
  name: { type: String, required: true, index: false, unique: false },
  mailaddress: { type: String, required: true, default: false, index: false },
});
module.exports.User = User;

// --------------------------------------------------
// -------------- Token -------------- --------------
// --------------------------------------------------
const Token = new mongoose.Schema({
  token: { type: String, required: true, index: true, unique: true },
  user: { type: String, required: false, index: true, unique: false, default: 'ANONYMOUS' },
});
module.exports.Token = Token;
