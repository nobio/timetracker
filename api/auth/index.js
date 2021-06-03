const util = require('./util-auth');
const jwt = require('jsonwebtoken');

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
    const result = await util.getAllUsers();
    res.status(200).json(result);
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: err });
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
  try {
    const result = await util.getUser(req.params.id);
    res.status(200).json(result);
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: err });
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
    const result = await util.deleteUser(req.params.id);
    res.status(202).json(result);
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: err });
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
    const result = await util.createUser(req.body.username, req.body.password, req.body.name, req.body.mailAddress);
    res.status(201).json(result);
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: err });
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
    const result = await util.updateUser(req.params.id, req.body.username, req.body.name, req.body.mailAddress);
    res.status(201).json(result);
  } catch (err) {
    console.error(err)
    if(err.message === 'User does not exists')
      res.status(404).json({ message: err.message });
    else
      res.status(500).json({ message: err.message });
  }
};

/**
 * updates only the password of a user
 * @param {*} req 
 * @param {*} res 
 */
exports.updateUsersPassword = async (req, res) => {
  try {
    const result = await util.updateUsersPassword(req.params.id, req.body.password);
    res.status(201).json(result);
  } catch (err) {
    console.error(err)
    if(err.message === 'User does not exists')
      res.status(404).json({ message: err.message });
    else
      res.status(500).json({ message: err.message });
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
  const password = req.body.password;
  if (password == null) {
    res.status(400).send();
    return;
  }

  try {
    const tokens = await util.login(req.body.username, password);
    res.status(200).json(tokens);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.logout = async (req, res) => {
  try {
    await util.logout(req.params.token);
    res.status(200).send();
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * Use the refresh token to generate a new token
 */
exports.refreshToken = async (req, res) => {
  const refreshToken = req.params.token;
  if (refreshToken == null) {
    res.status(400).send('Unauthorized refresh token');
    return;
  }

  try {
    const token = await util.refreshToken(refreshToken);
    res.status(200).send(token);
  } catch (err) {
    console.error(err)
    res.status(400).send({ message: err.message });
  }
};

/**
 * Middleware to authorize the access token created by /api/auth/login
 * This method is intentionally not implemented in util-auth because it
 * does not care about the content only about request header
 *
 * Clients need to create a new token using the refresh token when they got a 403 in the first place
 *
 * @param req Request object (includes the header and possibly token); user object will be added
 * @param res Respons object; only used in case of error
 * @param next callback to next middleware
 */
exports.authorizeToken = async (req, res, next) => {

  // check the switch if we are supposed to authorize
  // or request is a login POST (must be possible without token)
  if (process.env.AUTHORIZATION !== 'on' || 
    (
      (req.method === 'POST' && req.url === '/api/auth/login') ||
      (req.method === 'POST' && req.url.startsWith('/api/auth/logout')) ||
      (req.method === 'POST' && req.url.startsWith('/api/auth/token')) ||
      (req.method === 'GET' && req.url.startsWith('/api-docs'))
    )) {
    // just continue...
    console.log('authorization disabled for ' + req.url)
    res.status(200);
    return next();
  }

  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.status(401).send('Unauthorized');

  await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) {
      if(err.name == 'TokenExpiredError') return res.status(401).send(err.message);
      else return res.status(403).send(err.message);
    }

    req.user = user; // store user in request object
    res.status(200);
    next();
  });
};

