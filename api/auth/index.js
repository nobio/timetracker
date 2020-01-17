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
    const result = await util.getAllUsers(req.body.name, req.body.password);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


/**
 * create a new user
 *
 * curl -X POST -H "Content-Type: application/json" -d '{"name": "Tester", "password": "test12345"}' http://localhost:30000/api/users
 *
 * @param {*} req Request object
 * @param {*} res Response object
 */
exports.createUser = async (req, res) => {
  try {
    const result = await util.createUser(req.body.name, req.body.password);
    res.status(201).json(result);
  } catch (err) {
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
    res.status(401).send();
    return;
  }

  try {
    const tokens = await util.login(req.body.name, password);
    res.status(200).json(tokens);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * Use the refresh token to generate a new token
 */
exports.refreshToken = async (req, res) => {
  const refreshToken = req.body.token;
  if (refreshToken == null) {
    res.status(401).send();
    return;
  }

  try {
    const token = await util.refreshToken(refreshToken);
    res.status(200).send(token)
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

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
  if (process.env.AUTHORIZATION !== 'on' || (
    (req.method === 'POST' && req.url === '/api/auth/login') || 
    (req.method === 'POST' && req.url === '/api/auth/token')
  )) {
    // just continue...
    res.status(200);
    return next();
  }

  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.status(401).send();

  await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
    // console.log(err)
    if (err) return res.status(403).send();

    req.user = user; // store user in request object
    res.status(200);
    next();
  });
};

