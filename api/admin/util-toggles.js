require('../../db');
const mongoose = require('mongoose');

const Toggle = mongoose.model('Toggle');

// ============================= TOGGLES ====================================
exports.getAllToggles = () => new Promise((resolve, reject) => {
  Toggle.find()
    .then(result => resolve(result))
    .catch(err => reject(err));
});

exports.getToggle = id => new Promise((resolve, reject) => {
  Toggle.findById(id)
    .then(result => resolve(result))
    .catch(err => reject(err));
});

exports.getToggleByName = name => new Promise((resolve, reject) => {
  Toggle.findOne({ name })
    .then(result => resolve(result))
    .catch(err => reject(err));
});

exports.getToggleStatus = () => new Promise((resolve, reject) => {
  resolve({
    NOTIFICATION_SLACK: (process.env.SLACK_TOKEN != null && process.env.SLACK_TOKEN != undefined),
  });
});

exports.createToggle = (name, toggle, notification) => new Promise((resolve, reject) => {
  new Toggle({
    name,
    toggle,
    notification,
  }).save()
    .then(toggle => resolve(toggle))
    .catch(err => reject(err));
});

exports.deleteToggle = id => new Promise((resolve, reject) => {
  Toggle.findByIdAndRemove(id)
    .then(toggle => resolve(toggle))
    .catch(err => reject(err));
});

exports.deleteTestToggles = () => new Promise((resolve, reject) => {
  Toggle.deleteMany({ name: /TEST-TOGGLE/ })
    .then(resolve('all test tokens deleted'))
    .catch(err => reject(err));
});

exports.updateToggle = (id, toggle, notification) => new Promise((resolve, reject) => {
  Toggle.findById(id)
    .then((tog) => {
      if (tog === null) {
        resolve(null);
        return;
      }
      tog.toggle = (toggle === undefined || toggle === null) ? tog.toggle : toggle; // maybe, only notification is pased
      tog.notification = (notification === undefined || notification === null) ? '' : notification;
      return tog;
    })
    .then(tog => tog.save())
    .then(tog => resolve(tog))
    .catch(err => reject(err));
});
