const moment = require('moment');
const mongoose = require('mongoose');

const User = mongoose.model('User');
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

  res.status(200).json({
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

/**
 * Perform health check on this application
 *
 * @param {*} req
 * @param {*} res
 {
  "status": "pass",
  "version": "11.2.3",
  "time": "2000-01-01T10:15:02.151Z",
  "details": [
    {
      "name": "database",
      "componentType": "component",
      "metricUnit": "ms",
      "metricValue": "string"
    }
  ]
}
 */
exports.healtchckech = async (req, res) => {
  const healthData = {
    version: packageJson.version,
    time: moment().toISOString(),
    status: 'pass',
    details: [],
  };

  // ------------ 1. test slack ------------
  healthData.details.push({
    name: 'slack available',
    componentType: 'system',
    metricUnit: 'boolean',
    metricValue: process.env.SLACK_URL != undefined,
  });

  // ------------ 2. test database by reading all users ------------
  const databaseDetail = {
    name: 'MongoDB',
    componentType: 'database',
    metricUnit: 'boolean',
  };
  healthData.details.push(databaseDetail);

  try {
    const users = await User.find();
    databaseDetail.metricValue = true;
  } catch (error) {
    databaseDetail.metricValue = false;
  }

  res.status(200).json(healthData);
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
  res.status(200).json(result);
};
