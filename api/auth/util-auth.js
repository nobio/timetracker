const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const createError = require('http-errors');

const User = mongoose.model('User');
const Token = mongoose.model('Token');

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
  if (!name) throw createError(400, 'User must be provided');
  if (!password) throw createError(400, 'No password provided');

  const mdbUser = await User.findOne({ name });
  if (mdbUser == null) throw createError(401, 'User not authenticated');

  if (!(await bcrypt.compare(password, mdbUser.password))) {
    throw createError(401);
  }
  const user = { name: mdbUser.name };

  const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRE });
  const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRE });

  new Token({
    token: refreshToken,
    user: mdbUser.name,
  }).save();

  return { accessToken, refreshToken };
};

/**
 * logs out and removes refresh session from database
 *
 * @param req: contains refresh token (named token)
 */
exports.logout = async (token) => {
  if (!token) throw createError(400, 'Token must be provided');
  try {
    await Token.deleteOne({ token });
  } catch (err) {
    return createError(400, err.message);
  }
};

/**
 * validates input and creates a new token with expire time using (validating) the refresh token
 */
exports.refreshToken = async (refreshToken) => {
  const storedRefreshToken = await Token.findOne({ token: refreshToken });
  if (storedRefreshToken == null) {
    throw createError(401, 'Unauthorized (invalid refresh token)');
  }

  let accessToken;
  const user = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  accessToken = jwt.sign({ name: user.name }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRE });

  return { accessToken, user };
};

