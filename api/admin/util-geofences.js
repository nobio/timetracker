/* eslint-disable max-len */
/* eslint-disable no-underscore-dangle */
require('../../db');

const mongoose = require('mongoose');
const moment = require('moment');

const GeoFence = mongoose.model('GeoFence');

function castGeofence(mongooseGeofence) {
  if (!mongooseGeofence) return null;
  return {
    id: mongooseGeofence._id,
    enabled: mongooseGeofence.enabled,
    longitude: mongooseGeofence.longitude,
    latitude: mongooseGeofence.latitude,
    radius: mongooseGeofence.radius,
    description: mongooseGeofence.description,
    isCheckedIn: mongooseGeofence.isCheckedIn,
    lastChange: mongooseGeofence.lastChange,
  };
}
function castGeofences(mongooseGeofences) {
  const props = [];
  mongooseGeofences.forEach((geo) => {
    props.push(castGeofence(geo));
  });
  return props;
}

// ============================= GEOFENCES ====================================
exports.getGeofences = async () => {
  try {
    return castGeofences(await GeoFence.find());
  } catch (error) {
    throw new Error(error);
  }
};

exports.getGeofence = async (id) => {
  if (!id) throw new Error('the id must not be undefined');
  try {
    return castGeofence(await GeoFence.findOne({ _id: id }));
  } catch (error) {
    console.error(error.message);
    throw new Error(`geofence with id ${id} could not be found`);
  }
};

exports.createGeofence = async (enabled, longitude, latitude, radius, description, isCheckedIn, lastChange) => {
  try {
    const newGeoFence = await new GeoFence({
      enabled, longitude, latitude, radius, description, isCheckedIn, lastChange,
    }).save();
    return castGeofence(newGeoFence);
  } catch (error) {
    console.error(error.message);
    throw new Error('could not create new geofence');
  }
};

exports.setGeofence = async (geofence) => {
  if (geofence === null || !geofence) return null;
  if (geofence.id === null) throw new Error('could not create new geofence: geo fence object could not be updated because it does not exist');

  try {
    const geoFence = await GeoFence.findOne(new mongoose.Types.ObjectId(geofence.id));
    geoFence.enabled = geofence.enabled;
    geoFence.isCheckedIn = geofence.isCheckedIn;
    geoFence.lastChange = moment().toISOString(); // always set lastChange to now
    if (geofence.longitude) geoFence.longitude = geofence.longitude;
    if (geofence.latitude) geoFence.latitude = geofence.latitude;
    if (geofence.radius) geoFence.radius = geofence.radius;
    if (geofence.description) geoFence.description = geofence.description;

    await geoFence.save();
    return castGeofence(geoFence);
  } catch (error) {
    // console.error(error.message);
    throw new Error(`could not create new geofence: ${error.message}`);
  }
};

exports.deleteGeofence = async (id) => {
  if (!id) { throw new Error('the id must not be undefined'); }

  try {
    await GeoFence.findOneAndDelete({ _id: id });
  } catch (error) {
    throw new Error(error.message);
  }
};

exports.resetGeofenceCheckins = async () => {
  try {
    const geofences = await GeoFence.find();
    geofences.forEach((geofence) => {
      if (geofence.isCheckedIn) {
        geofence.isCheckedIn = false;
        geofence.save();
      }
    });
  } catch (error) {
    throw new Error(error.message);
  }
};
