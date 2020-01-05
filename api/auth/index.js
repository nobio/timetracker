const util = require('./util-auth');

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
 * @param {*} res Response object
 */
exports.login = async (req, res) => {
  try {
    const result = await util.login(req.body.name, req.body.password);
    res.status(200).json({ response: result });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
