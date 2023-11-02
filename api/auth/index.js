/* eslint-disable max-len */
const jwt = require('jsonwebtoken');
const { Tracer } = require('../tracing/Tracer');
const util = require('./util-auth');
const globalUtil = require('../global_util');

/**
 * reads all users from database
 *
 * curl -X GET http://localhost:30000/api/users
 *
 * @param {*} req Request object
 * @param {*} res Response object
 */
exports.getAllUsers = async (req, res) => {
  const span = Tracer.startSpan('auth.getAllUsers');

  try {
    const result = await util.getAllUsers();
    res.status(200).json(result);
  } catch (err) {
    // console.error(err);
    span.recordException(err);
    res.status(500).json({ message: err });
  } finally {
    span.end();
  }
};

/**
 * reads one user from database
 *
 * curl -X GET http://localhost:30000/api/users/12345678
 *
 * @param {*} req Request object
 * @param {*} res Response object
 */
exports.getUser = async (req, res) => {
  // console.log(req.params.url);
  const span = Tracer.startSpan('auth.getUser');

  if (span.isRecording()) { span.setAttribute('userId', req.params.id); }
  try {
    const result = await util.getUser(req.params.id);
    res.status(200).json(result);
  } catch (err) {
    // console.error(err);
    span.recordException(err);
    res.status(500).json({ message: err });
  } finally {
    span.end();
  }
};

/**
 * Deletes a user from database
 *
 * curl -X DELETE http://localhost:30000/api/users/<id>
 *
 * @param {*} req Request object
 * @param {*} res Response object
 */
exports.deleteUser = async (req, res) => {
  const span = Tracer.startSpan('auth.deleteUser');

  if (span.isRecording()) { span.setAttribute('userId', req.params.id); }

  try {
    const result = await util.deleteUser(req.params.id);
    globalUtil.sendMessage('DELETE_USER', `user ${req.params.id} was deleted`);
    res.status(202).json(result);
  } catch (err) {
    // console.error(err);
    span.recordException(err);
    res.status(500).json({ message: err });
  } finally {
    span.end();
  }
};

/**
 * create a new user
 *
 * curl -X POST -H "Content-Type: application/json" -d '{"name": "Tester", "mailAddress": "albert@einstein.edu", "password": "test12345"}' http://localhost:30000/api/users
 *
 * @param {*} req Request object
 * @param {*} res Response object
 */
exports.createUser = async (req, res) => {
  const span = Tracer.startSpan('auth.createUser');
  if (span.isRecording()) { span.setAttribute('user', req.body.username); }

  try {
    const result = await util.createUser(req.body.username, req.body.password, req.body.name, req.body.mailAddress);
    globalUtil.sendMessage('CREATE_USER', `user ${req.body.username} was created`);
    res.status(201).json(result);
  } catch (err) {
    // console.error(err);
    span.recordException(err);
    res.status(500).json({ message: err });
  } finally {
    span.end();
  }
};

/**
 * updates an existing user
 *
 * curl -X PUT -H "Content-Type: application/json" -d '{"name": "Tester", "mailAddress": "albert@einstein.edu"}' http://localhost:30000/api/users/123456789
 *
 * @param {*} req Request object
 * @param {*} res Response object
 */
exports.updateUser = async (req, res) => {
  const span = Tracer.startSpan('auth.updateUser');
  if (span.isRecording()) {
    span.setAttribute('userId', req.params.id);
    span.setAttribute('userId', req.params.name);
  }

  try {
    const result = await util.updateUser(req.params.id, req.body.username, req.body.name, req.body.mailAddress);
    globalUtil.sendMessage('UPDATE_USER', `user ${req.params.id} was updated`);
    res.status(201).json(result);
  } catch (err) {
    // console.error(err);
    span.recordException(err);
    if (err.message === 'User does not exists') res.status(404).json({ message: err.message });
    else res.status(500).json({ message: err.message });
  } finally {
    span.end();
  }
};

/**
 * updates only the password of a user
 * @param {*} req
 * @param {*} res
 */
exports.updateUsersPassword = async (req, res) => {
  const span = Tracer.startSpan('auth.updateUsersPassword');
  if (span.isRecording()) { span.setAttribute('userId', req.params.id); }

  try {
    const result = await util.updateUsersPassword(req.params.id, req.body.password);
    globalUtil.sendMessage('UPDATE_USER', `password for user ${req.params.id} was updated`);
    res.status(201).json(result);
  } catch (err) {
    // console.error(err);
    span.recordException(err);

    if (err.message === 'User does not exists') res.status(404).json({ message: err.message });
    else res.status(500).json({ message: err.message });
  } finally {
    span.end();
  }
};

/**
 * login with user and password (needs to be passed)
 *
 * curl -X POST -H "Content-Type: application/json" -d '{"name": "Tester", "password": "test12345"}' http://localhost:30000/api/users/login
 *
 * @param {*} req Request object
 * @param {*} res Response object; resp.json: {accessToken: '...'}
 */
exports.login = async (req, res) => {
  // console.log(req)
  const span = Tracer.startSpan('auth.login');
  if (span.isRecording()) { span.setAttribute('userName', req.body.username); }

  globalUtil.sendMessage('LOGIN', `try to login user ${req.body.username}`);
  const { password } = req.body;
  if (password === null) {
    span.setStatus({ code: 401 });
    res.status(401).send();
    return;
  }

  try {
    const tokens = await util.login(req.body.username, password);
    res.status(200).json(tokens);
  } catch (err) {
    console.error(err);
    span.recordException(err);
    if (err.status) {
      res.status(err.status).json({ message: err.message });
    } else {
      res.status(401).json({ message: err.message });
    }
    span.setStatus({ code: 400, message: String(err.message) });
  } finally {
    span.end();
  }
};

/**
 * logout of a session
 * curl -X POST -H "Content-Type: application/json" -d '{"token": "eyJh...sw5c"}' http://localhost:30000/api/auth/logout
 *
 * @param {token} req JWT Token
 * @param {*} res
 */
exports.logout = async (req, res) => {
  const span = Tracer.startSpan('auth.logout');
  if (span.isRecording()) { span.setAttribute('userName', req.body.token); }

  try {
    await util.logout(req.body.token);
    res.status(200).send();
  } catch (err) {
    span.recordException(err);
    // commented for bugfix #101
    // res.status(400).json({ message: err.message });
    res.status(200).json({ message: err.message });
  } finally {
    span.end();
  }
};

/**
 * Use the refresh token to generate a new token
 * curl -X POST -H "Content-Type: application/json" -d '{"token": "eyJh...sw5c"}' http://localhost:30000/api/auth/token
 *
 * @param {token} req JWT Token
 * @param {*} res
 */
exports.refreshToken = async (req, res) => {
  const span = Tracer.startSpan('auth.refreshToken');
  if (span.isRecording()) { span.setAttribute('refreshToken', req.body.token); }

  const refreshToken = req.body.token;
  if (refreshToken === null) {
    res.status(400).send('Unauthorized refresh token');
    return;
  }

  try {
    const token = await util.refreshToken(refreshToken);
    res.status(200).send(token);
  } catch (err) {
    // console.error(err);
    span.recordException(err);
    res.status(400).send({ message: err.message });
  } finally {
    span.end();
  }
};

exports.authorize = async (req, res, next) => {
  const span = Tracer.startSpan('auth.authorize');
  if (span.isRecording()) {
    span.setAttribute('method', req.method);
    span.setAttribute('url', req.url);
  }

  // console.log(req.url);
  // check the switch if we are supposed to authorize
  // or request is a login POST (must be possible without token)
  // console.log(req.method, req.url);
  if (process.env.AUTHORIZATION !== 'on' || (
    (req.method === 'POST' && req.url.startsWith('/api/auth/login'))
    || (req.method === 'POST' && req.url.startsWith('/api/auth/logout'))
    || (req.method === 'POST' && req.url.startsWith('/api/auth/token'))
    || (req.method === 'GET' && req.url.startsWith('/api/health'))
    || (req.method === 'GET' && req.url.startsWith('/api-docs'))
    || (req.method === 'GET' && req.url.startsWith('/ws'))
    || (req.url.startsWith('/api/log'))
  )) {
    // just continue...
    // console.log(`authorization disabled for ${req.url}`);
    res.status(200);
    span.end();
    return next();
  } if (process.env.AUTHORIZATION === 'on' && (
    (req.method === 'POST' && (req.url === '/api/geofence' || req.url === '/api/geofence/')) // .startsWith is not sufficiant since there is an endpoint /api/geofences
    || (req.method === 'POST' && req.url.startsWith('/api/geotrack'))
  )) {
    // basic authorisation
    span.end();
    return this.authorizeBasicAuth(req, res, next);
  }
  // token authorization for the rest of us
  span.end();
  return this.authorizeToken(req, res, next);
};

/**
 * Middleware to authorize the access token created by /api/auth/login
 * This method is intentionally not implemented in util-auth because it
 * does not care about the content only about request header
 *
 * Clients need to create a new token using the refresh token when they got a 403 in the first place
 *
 * @param req Request object (includes the header and possibly token); user object will be added
 * @param res Respons object; only used in case of err
 * @param next callback to next middleware
 */
exports.authorizeToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  const span = Tracer.startSpan('auth.authorizeToken');
  if (span.isRecording()) { span.setAttribute('authHeader', authHeader); }

  if (!token) return res.status(401).send('Unauthorized');

  await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      span.recordException(err);
      span.end();
      if (err.name === 'TokenExpiredError') return res.status(401).send(err.message);
      return res.status(403).send(err.message);
    }

    req.user = user; // store user in request object
    res.status(200);
    span.end();
    next();
  });
};

/**
 * Middleware to authorize the access token created by /api/auth/login
 * This method is intentionally not implemented in util-auth because it
 * does not care about the content only about request header
 *
 * Clients need to create a new token using the refresh token when they got a 403 in the first place
 *
 * @param req Request object (includes the header and possibly token); user object will be added
 * @param res Respons object; only used in case of err
 * @param next callback to next middleware
 */
exports.authorizeBasicAuth = async (req, res, next) => {
  const credentials = req.headers.authorization;
  const span = Tracer.startSpan('auth.authorizeBasicAuth');
  if (span.isRecording()) { span.setAttribute('credentials', credentials); }

  try {
    await util.validateBasicAuth(credentials);
    res.status(200);
    next();
  } catch (err) {
    // console.log(err);
    span.recordException(err);
    if (err.status) res.status(err.status).json({ message: err.message });
    else res.status(400).json({ message: err.message });
  } finally {
    span.end();
  }
};
