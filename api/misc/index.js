const logger = require('../config/logger'); // Logger configuration
const moment = require('moment');
const mongoose = require('mongoose');

const User = mongoose.model('User');
const packageJson = require('../../package.json');

/**
 * exposes a ping endpoint and respones with pong
 *
 * curl -X GET http://localhost:30000/api/ping
 */
exports.ping = async (req, res) => {
  const ip = (
    req.headers['cf-connecting-ip']
    || req.headers['x-real-ip']
    || req.headers['x-forwarded-for']
    || (req.connection ? req.connection.remoteAddress : false)
    || ''
  ).split(',')[0].trim();

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
  res.status(200).json({
    version: packageJson.version,
    last_build: packageJson.last_build,
  });
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
 * curl -X GET http://localhost:30000/api/experiment
 */
exports.experiment = async (req, res) => {
  logger.info('================================== HEADERS ==================================');
  logger.info(req.headers);
  logger.info('=================================== BODY ==================================');
  logger.info(req.body);
  logger.info('===========================================================================');
  res.status(200).send('nothing to see here');
};

/**
 * logs several parameters of request like body, header, etc.
 *
 * curl -X GET http://localhost:30000/api/log
 * curl -X POST http://localhost:30000/api/log
 * curl -X PUT http://localhost:30000/api/log
 */
exports.log = async (req, res) => {
  const resp = {};

  resp.url = req.url;
  resp.method = req.method;

  if (Object.keys(req.headers).length) resp.headers = req.headers;
  if (Object.keys(req.body).length) resp.body = req.body;

  logger.debug(JSON.stringify(resp, null, 2));

  res.status(201).json(resp);
};
