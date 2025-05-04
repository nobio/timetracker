const logger = require('../config/logger'); // Logger configuration
require('../../db');

const mongoose = require('mongoose');

const Properties = mongoose.model('Properties');

function castProperty(mongooseProperty) {
  if (!mongooseProperty) return null;
  return { key: mongooseProperty.key, value: mongooseProperty.value };
}
function castProperties(mongooseProperties) {
  const props = []; // new array to create a "pure" property without mongo ID and stuff
  mongooseProperties.forEach((prop) => {
    props.push(castProperty(prop));
  });
  return props;
}

// ============================= PROPERTIES ====================================
exports.getProperties = () => new Promise((resolve, reject) => {
  Properties.find()
    .then((properties) => resolve(castProperties(properties)))
    .catch((err) => reject(err));
});

exports.getProperty = (key) => new Promise((resolve, reject) => {
  if (!key) reject(new Error('the key must not be undefined'));

  Properties.findOne({ key })
    .then((property) => resolve(castProperty(property)))
    .catch((err) => reject(err));
});

exports.setProperty = (key, value) => new Promise((resolve, reject) => {
  if (!key) { reject(new Error('the key must not be undefined')); return; }
  if (!value) { reject(new Error('the value must not be undefined')); return; }

  Properties.findOne({ key })
    .then((property) => {
      if (property === null) {
        // create a new property
        // logger.info(`creating a new property`);
        property = new Properties({ key, value });
      }
      property.value = value;
      return property;
    })
    .then((property) => property.save())
    .then((property) => resolve(property))
    .catch((err) => reject(err));
});

exports.deleteProperty = (key) => new Promise((resolve, reject) => {
  if (!key) { reject(new Error('the key must not be undefined')); return; }

  Properties.findOneAndDelete({ key })
    .then((property) => resolve(property))
    .catch((err) => reject(err));
});
