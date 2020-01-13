const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const User = mongoose.model('User');
const jwt = require('jsonwebtoken');

/**
 * Reads all registeredusers
 *
 * @returns Array of all registered users
 * @param {*} name User name of user
 * @param {*} password Password of user
 */
exports.getAllUsers = async () => User.find();

/**
 * creates a new user in database
 *
 * @param {*} name User name of user
 * @param {*} password Password of user
 */
exports.createUser = async (name, password) => {
  if (!name) throw Error('User must be provided');
  if (!password) throw Error('No password provided');

  const user = await User.findOne({ name });
  if (user) throw Error('User already exists');

  const hashedPassword = await bcrypt.hash(password, 10);
  new User({
    name,
    password: hashedPassword,
  }).save();

  return 'User created';
};

/**
 * login with user and password (needs to be passed)
 *
 * @param {*} name User name of user
 * @param {*} password Password of user
 * @returns accessToken
 */
exports.login = async (name, password) => {
  if (!name) throw Error('User must be provided');
  if (!password) throw Error('No password provided');

  const mdbUser = await User.findOne({ name });
  if (mdbUser == null) throw Error('User not authenticated');

  if (!(await bcrypt.compare(password, mdbUser.password))) {
    throw Error('User not authenticated');
  }
  const user = { name: mdbUser.name };

  const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRE });
  const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET);

  return { accessToken, refreshToken };
};

