const util = require('./util-auth');

/**
 * reads all users from database
 *
 * curl -X GET http://localhost:30000/api/users
 */
exports.getAllUsers = (req, res) => {
  util.getAllUsers()
    .then(response => res.status(200).json(response))
    .catch(err => res.status(500).json(err));
};

/**
 * create a new user
 *
 * curl -X POST -H "Content-Type: application/json" -d '{"name": "nobio@whatever.com", "password": "Test12345"}' http://localhost:30000/api/users
 */
exports.createUser = async (req, res) => {
  try {
    const result = await util.createUser(req.body.name, req.body.password);
    res.status(201).json(result);
  } catch (err) {
    res.status(500).json(err);
  }
};

/** login with user and password (needs to be passed) */
exports.login = async (req, res) => {
  try {
    const result = await util.login(req.body.name, req.body.password);
    res.status(200).json({ response: result });
  } catch (err) {
    console.log(err);
    console.log(err.message);
    res.status(500).json({ message: err.message });
  }
};
