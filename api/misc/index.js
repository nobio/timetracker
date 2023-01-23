const moment = require('moment');
const mongoose = require('mongoose');

const User = mongoose.model('User');
const packageJson = require('../../package.json');
const { Tracer } = require('../tracing/Tracer');

/**
 * exposes a ping endpoint and respones with pong
 *
 * curl -X GET http://localhost:30000/api/ping
 */
exports.ping = (req, res) => {
  const span = Tracer.startSpan('misc.ping');
  const ip = (req.headers['x-forwarded-for']
    || req.connection.remoteAddress
    || req.socket.remoteAddress
    || req.connection.socket.remoteAddress).split(',')[0];

  res.status(200).json({
    response: 'pong',
    client_ip: ip,
  });
  span.end();
};

/**
 * returns version information
 *
 * curl -X GET http://localhost:30000/api/version
 */
exports.version = (req, res) => {
  const span = Tracer.startSpan('misc.version');
  if (span.isRecording()) {
    span.setAttribute('version', packageJson.version);
    span.setAttribute('last_build', packageJson.last_build);
  }

  if (packageJson) {
    res.status(200).json({
      version: packageJson.version,
      last_build: packageJson.last_build,
    });
  } else {
    res.status(500).send('no package.json found');
  }
  span.end();
};

/**
 * Perform health check on this application
 *
 * @param {*} req
 * @param {*} res
 *
 * curl -X GET http://localhost:30000/api/health
 *
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
exports.healthcheck = async (req, res) => {
  const span = Tracer.startSpan('misc.healthcheck');

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
  if (span.isRecording()) { span.setAttribute('healthData', healthData); }
  span.end();
};

/*
 * test and experiment endpoint
 *
 * curl -X GET http://localhost:30000/api/experiment
 */
exports.experiment = async (req, res) => {
  const admin = require('../admin/util-admin');
  let result;

  result = await admin.dumpModels();
  console.log(result);
  res.status(200).json(result);
};

/**
 * logs several parameters of request like body, header, etc.
 *
 * curl -X GET http://localhost:30000/api/log
 * curl -X POST http://localhost:30000/api/log
 * curl -X PUT http://localhost:30000/api/log
 */
exports.log = async (req, res) => {
  const span = Tracer.startSpan('misc.ping');

  const resp = {};

  resp.url = req.url;
  resp.method = req.method;
  //  resp.headers = JSON.stringify(req.headers);
  //  resp.body = JSON.stringify(req.body);
  if (Object.keys(req.headers).length) resp.headers = req.headers;
  if (Object.keys(req.body).length) resp.body = req.body;

  console.log(JSON.stringify(resp));

  res.status(200).json(resp);
  span.end();
};
