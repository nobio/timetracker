/* eslint-disable max-len */
const jwt = require('jsonwebtoken');
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
  try {
    const users = await util.getAllUsers();

    if (!users || users.length === 0) {
      return res.status(204).json({ message: 'No users found' });
    }

    return res.status(200).json({
      count: users.length,
      users,
    });
  } catch (err) {
    // console.error(err);
    return res.status(500).json({
      error: 'Internal server error',
      message: err.message,
    });
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
  try {
    if (!req.params.id) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'User ID is required',
      });
    }

    const result = await util.getUser(req.params.id);

    if (!result) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
    }

    return res.status(200).json(result);
  } catch (err) {
    // console.error(err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: err.message,
    });
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
  try {
    if (!req.params.id) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'User ID is required',
      });
    }

    const result = await util.deleteUser(req.params.id);

    if (!result) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
    }

    globalUtil.sendMessage('DELETE_USER', `user ${req.params.id} was deleted`);
    return res.status(202).json(result);
  } catch (err) {
    // console.error(err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: err.message,
    });
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
  try {
    // Validate required fields
    if (!req.body.username || !req.body.password || !req.body.name || !req.body.mailAddress) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'All fields (username, password, name, mailAddress) are required',
      });
    }

    const result = await util.createUser(
      req.body.username,
      req.body.password,
      req.body.name,
      req.body.mailAddress,
    );

    globalUtil.sendMessage('CREATE_USER', `user ${req.body.username} was created`);

    return res.status(201).json({
      id: result,
      username: req.body.username,
      name: req.body.name,
      mailAddress: req.body.mailAddress,
    });
  } catch (err) {
    // console.error(err);
    return res.status(500).json({
      error: 'Internal Server Error',
      message: err.message || 'Error creating user',
    });
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
  try {
    // Validate required id parameter
    if (!req.params.id) {
      return res.status(404).json({
        error: 'Bad Request',
        message: 'User ID is required',
      });
    }

    // Update user with provided fields
    const result = await util.updateUser(
      req.params.id,
      req.body.username,
      req.body.name,
      req.body.mailAddress,
    );

    // Send notification message
    globalUtil.sendMessage('UPDATE_USER', `user ${req.params.id} was updated`);

    return res.status(201).json({
      id: result,
      username: req.body.username,
      name: req.body.name,
      mailAddress: req.body.mailAddress,
    });
  } catch (err) {
    // console.error(err);
    if (err.message === 'User does not exists') {
      return res.status(404).json({
        error: 'Not Found',
        message: err.message,
      });
    }

    return res.status(500).json({
      error: 'Internal Server Error',
      message: err.message || 'Error updating user',
    });
  }
};

/**
 * updates only the password of a user
 * @param {*} req
 * @param {*} res
 */
exports.updateUsersPassword = async (req, res) => {
  try {
    // Validate required parameters
    if (!req.params.id) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'User ID is required',
      });
    }

    if (!req.body.password) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Password is required',
      });
    }

    const result = await util.updateUsersPassword(req.params.id, req.body.password);

    globalUtil.sendMessage('UPDATE_USER', `password for user ${req.params.id} was updated`);

    return res.status(201).json({
      id: req.params.id,
      message: 'Password updated successfully',
    });
  } catch (err) {
    // console.error(err);
    if (err.message === 'User does not exists') {
      return res.status(404).json({
        error: 'Not Found',
        message: err.message,
      });
    }

    return res.status(500).json({
      error: 'Internal Server Error',
      message: err.message || 'Error updating password',
    });
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
  globalUtil.sendMessage('LOGIN', `try to login user ${req.body.username}`);
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Username and password are required',
    });
  }

  try {
    const tokens = await util.login(username, password);
    return res.status(200).json(tokens);
  } catch (err) {
    console.error(err);
    const status = err.status || 401;
    return res.status(status).json({
      error: status === 401 ? 'Unauthorized' : 'Error',
      message: err.message,
    });
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
  try {
    await util.logout(req.body.token);
    res.status(200).send();
  } catch (err) {
    // commented for bugfix #101
    // res.status(400).json({ message: err.message });
    res.status(200).json({ message: err.message });
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
    res.status(400).send({ message: err.message });
  }
};

exports.authorize = async (req, res, next) => {
  console.log(`URL: ${req.url}`);
  const API_PATH = process.env.API_PATH || '/api';
  // console.log(req.url);
  // check the switch if we are supposed to authorize
  // or request is a login POST (must be possible without token)
  // console.log(req.method, req.url);
  if (process.env.AUTHORIZATION !== 'on' || (
    (req.method === 'POST' && req.url.startsWith(`${API_PATH}/auth/login`))
    || (req.method === 'POST' && req.url.startsWith(`${API_PATH}/auth/logout`))
    || (req.method === 'POST' && req.url.startsWith(`${API_PATH}/auth/token`))
    || (req.method === 'GET' && req.url.startsWith(`${API_PATH}/health`))
    || (req.method === 'GET' && req.url.startsWith('api-docs'))
    || (req.method === 'GET' && req.url.startsWith('/ws'))
    || (req.url.startsWith(`${API_PATH}/log`))
    || (req.url.startsWith(`${API_PATH}/experiment`))
  )) {
    // just continue...
    // console.log(`authorization disabled for ${req.url}`);
    res.status(200);
    return next();
  } if (process.env.AUTHORIZATION === 'on' && (
    (req.method === 'POST' && (req.url === `${API_PATH}/geofence` || req.url === `${API_PATH}/geofence/`)) // .startsWith is not sufficiant since there is an endpoint /api/geofences
    || (req.method === 'POST' && req.url.startsWith(`${API_PATH}/geotrack`))
    || (req.method === 'PUT' && req.url === `${API_PATH}/entries`) // create entry but with basic auth :-)
  )) {
    // basic authorisation
    return this.authorizeBasicAuth(req, res, next);
  }
  // token authorization for the rest of us
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

  if (!token) return res.status(401).send('Unauthorized');

  await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      if (err.name === 'TokenExpiredError') return res.status(401).send(err.message);
      return res.status(403).send(err.message);
    }

    req.user = user; // store user in request object
    res.status(200);

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
  try {
    await util.validateBasicAuth(credentials);
    res.status(200);
    next();
  } catch (err) {
    // console.log(err);
    if (err.status) res.status(err.status).json({ message: err.message });
    else res.status(400).json({ message: err.message });
  }
};
