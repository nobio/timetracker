const mongoose = require('mongoose');
const GeoTracking = mongoose.model('GeoTracking');


/**
 * Stores Geo Locations (i.e. latitude and longitude) coming from a mobile device
 * to geo track
 *
 * curl -X POST -H "Content-Type: application/json" -d '{"latitude": "49.51429653451733", "longitude": "10.87531216443598", "accuracy": 10, "source": "cli"}' http://localhost:30000/api/geotrack
 */
exports.geoTracking = (req, res) => {
  console.log(JSON.stringify(req.body));
  if(req.body.longitude == null || req.body.latitude == null || req.body.accuracy == null || req.body.source == null) {
     res.status(400).send('missing data (longitude, latitude, accuracy, source)');
     return;
  }
  new GeoTracking({
    longitude: req.body.longitude,
    latitude: req.body.latitude,
    accuracy: req.body.accuracy,
    source: req.body.source
  })
    .save()
    .then(geoTrack => res.status(200).json(geoTrack))
    .catch(err => res.status(500).json(err.message));
};

/**
 * reads geo tracks
 * 
 * curl -X GET http://localhost:30000/api/geotrack
 */
exports.getGeoTracking = async (req, res) => {
  try {
    const tracks = await GeoTracking.find().sort({ date: 1 })
    res.status(200).json(tracks);
  } catch (err) {
    res.status(err.status).json({ message: err.message });
  }
};

