require('../../db');
require('../../db/cache');
const mongoose = require('mongoose');
const Toggle = mongoose.model('Toggle');

// ============================= TOGGLES ====================================
exports.getAllToggles = () => new Promise((resolve, reject) => {
  Toggle.find()
    .cache(120)
    .then((result) => resolve(result))
    .catch((err) => reject(err));
});

exports.getToggle = (id) => new Promise((resolve, reject) => {
  Toggle.findById(id)
    .cache()
    .then((result) => resolve(result))
    .catch((err) => reject(err));
});

exports.getToggleByName = (name) => new Promise((resolve, reject) => {
  Toggle.findOne({ name })
    .cache()
    .then((result) => resolve(result))
    .catch((err) => reject(err))
});

exports.getToggleStatus = () => new Promise((resolve, reject) => {
  resolve({
    NOTIFICATION_SLACK: (process.env.SLACK_URL != null && process.env.SLACK_URL != undefined && process.env.SLACK_URL != ''),
  });
});

exports.createToggle = (name, toggle, notification) => new Promise((resolve, reject) => {
  new Toggle({
    name,
    toggle,
    notification,
  }).save()
    .then((toggle) => resolve(toggle))
    .catch((err) => reject(err));
});

exports.deleteToggle = (id) => new Promise((resolve, reject) => {
  Toggle.findByIdAndRemove(id)
    .then((toggle) => resolve(toggle))
    .catch((err) => reject(err));
});

exports.deleteTestToggles = () => new Promise((resolve, reject) => {
  Toggle.deleteMany({ name: /TEST-TOGGLE/ })
    .then(resolve('all test tokens deleted'))
    .catch((err) => reject(err));
});

exports.updateToggle = async (id, toggle, notification) => {
  try {
    const tog = await Toggle.findById(id);
    if (!tog || tog === null) {
      return null;
    }

    tog.toggle = (toggle === undefined || toggle === null) ? tog.toggle : toggle; // maybe, only notification is pased
    tog.notification = (notification === undefined || notification === null) ? '' : notification;

    await tog.save();
    return tog;

  } catch (error) {
    console.err(error);
    throw error;
  }

};
