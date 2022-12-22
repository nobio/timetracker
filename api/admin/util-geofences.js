require('../../db');

const mongoose = require('mongoose');

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

exports.setGeofence = async (id, enabled, longitude, latitude, radius, description, isCheckedIn, lastChange) => {
  try {
    const geoFence = await GeoFence.findOne({ _id: id });
    if (geoFence == null) {
      throw new Error('geo fence object could not be updated because it does not exist');
    }
    geoFence.enabled = enabled;
    geoFence.isCheckedIn = isCheckedIn;

    if (longitude) geoFence.longitude = longitude;
    if (geoFence)geoFence.latitude = latitude;
    if (geoFence)geoFence.radius = radius;
    if (geoFence)geoFence.description = description;
    if (geoFence)geoFence.lastChange = lastChange;

    await geoFence.save();

    return castGeofence(geoFence);
  } catch (error) {
    console.error(error.message);
    throw new Error(`could not create new geofence: ${error.message}`);
  }
};

exports.deleteGeofence = async (id) => {
  if (!id) { throw new Error('the id must not be undefined'); return; }

  try {
    await GeoFence.findOneAndRemove({ _id: id });
    return;
  } catch (error) {
    throw new Error(error.message);
  }
};
