const mongoose = require('mongoose');
const moment = require('moment');

const TimeEntry = mongoose.model('TimeEntry');
const packageJson = require('../../package.json');

/**
 * exposes a ping endpoint and respones with pong
 *
 * curl -X GET http://localhost:30000/api/ping
 */
exports.ping = (req, res) => {
  const ip = (req.headers['x-forwarded-for']
    || req.connection.remoteAddress
    || req.socket.remoteAddress
    || req.connection.socket.remoteAddress).split(',')[0];

  res.status(200).send({
    response: 'pong',
    client_ip: ip,
  });
};

/**
 * returns version information
 *
 * curl -X GET http://localhost:30000/api/version
 */
exports.version = (req, res) => {
  if (packageJson) {
    res.status(200).json({
      version: packageJson.version,
      last_build: packageJson.last_build,
    });
  } else {
    res.status(500).send('no package.json found');
  }
};

exports.healtchckech = async (req, res) => {

};

/*
 * test and experiment endpoint
 *
 * curl -X GET http://localhost:30000/experiment
 */
exports.experiment = async (req, res) => {
  const admin = require('../admin/util-admin');
  let result;

  result = await admin.dumpModels();
  console.log(result);
  res.status(200).send(result);
};
