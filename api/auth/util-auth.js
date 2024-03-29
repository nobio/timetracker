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
 * @param {*} username User id in terms of credentials of user
 * @param {*} password Password of user
 * @param {*} name User name of user
 * @param {*} mailAddress mail address of user
 */
exports.getAllUsers = async () => {
  const users = [];
  try {
    const dbUsers = await User.find();
    dbUsers.forEach((user) => {
      users.push(
        {
          id: user._id,
          username: user.username,
          name: user.name,
          mailAddress: user.mailaddress,
        },
      );
    });
    return users;
  } catch (error) {
    throw new Error(`cannot load users ${error}`);
  }
};

exports.getUser = async (id) => {
  if (!id) throw Error('id must be provided');

  try {
    const user = await User.findById({ _id: id });

    return {
      id: user._id,
      username: user.username,
      name: user.name,
      mailAddress: user.mailaddress,
    };
  } catch (error) {
    throw new Error(`cannot load user ${id}: ${error}`);
  }
};

/**
 * creates a new user in database
 *
 * @param {*} username User name of user
 * @param {*} password Password of user
 * @param {*} name User name of user
 * @param {*} mailAddress  Mail address of uzser
 */
exports.createUser = async (username, password, name, mailAddress) => {
  if (!username) throw Error('Users unique user name must be provided');
  if (!password) throw Error('No password provided');
  if (!name) throw Error('Display name  must be provided');
  if (!mailAddress) throw Error('Mail address must be provided');

  const user = await User.findOne({ username });
  if (user) throw Error('User already exists');

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const newUser = await new User({
      username,
      password: hashedPassword,
      name,
      mailaddress: mailAddress,
    }).save();
    return newUser._id;
  } catch (error) {
    throw error;
  }
};

/**
 * updates an existing user in database
 *
 * @param {*} id Unique ID of user
 * @param {*} username User name of user (optional)
 * @param {*} name User name of user (optional)
 * @param {*} mailAddress mail address of user (optional)
 */
exports.updateUser = async (id, username, name, mailAddress) => {
  if (!id) throw Error('User does not exists');

  const user = await User.findById(id);
  if (!user) throw Error('User does not exists');

  if (username) user.username = username;
  if (name) user.name = name;
  if (mailAddress) user.mailaddress = mailAddress;

  try {
    const updatedUser = await user.save();
    return updatedUser.id;
  } catch (error) {
    throw error;
  }
};

exports.updateUsersPassword = async (id, password) => {
  if (!id) throw Error('User must be provided');
  if (!password) throw Error('Password must be provided');

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.findById(id);
    if (!user) throw Error('User does not exists');
    user.password = hashedPassword;

    return new Promise((resolve, reject) => {
      user.save()
        .then((ret) => resolve(ret._id))
        .catch((err) => reject(err));
    });
  } catch (error) {
    throw createError('User does not exists');
  }
};

/**
 * Delete a user by it's id
 * @param {*} id
 */
exports.deleteUser = async (id) => {
  if (!id) throw Error('id must be provided');
  return new Promise((resolve, reject) => {
    User.findByIdAndRemove(id)
      .then((res) => res)
      .then((ret) => resolve(ret))
      .catch((err) => reject(`cannot delete user ${id}`));
  });
};

/**
 * login with user and password (needs to be passed)
 *
 * @param {*} username User name of user
 * @param {*} password Password of user
 * @returns accessToken
 */
exports.login = async (username, password) => {
  if (!username) throw createError(400, 'User must be provided');
  if (!password) throw createError(400, 'No password provided');

  const mdbUser = await User.findOne({ username: { $eq: username } });
  if (mdbUser === null) throw createError(401, 'User not authenticated');

  if (!(await bcrypt.compare(password, mdbUser.password))) {
    throw createError(401, 'User not authenticated');
  }
  const user = {
    username: mdbUser.username,
    name: mdbUser.name,
    mailAddress: mdbUser.mailaddress,
  };

  const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRE });
  const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRE });

  // save the refresh token to database only. The access token will not be persisted
  new Token({
    token: refreshToken,
    user: mdbUser.username,
  }).save();

  return { accessToken, refreshToken };
};

/**
 * validates input and creates a new token with expire time using (validating) the refresh token
 */
exports.refreshToken = async (refreshToken) => {
  if (!refreshToken) throw createError(400, 'Refresh token must be provided');

  const storedRefreshToken = await Token.findOne({ token: { $eq: refreshToken } });
  if (storedRefreshToken === null) {
    throw createError(401, 'Unauthorized (invalid refresh token)');
  }
  const user = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
  delete user.iat; delete user.exp;
  const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRE });

  return { accessToken };
};

/**
 * logs out and removes refresh session from database
 *
 * @param req: contains refresh token (named token)
 */
exports.logout = async (token) => {
  // if (!token) throw createError(400, 'Token must be provided'); // commented for bugfix #101
  try {
    // await Token.deleteOne({ token });  // delete this refresh token
    const user = jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
    await Token.deleteMany({ user: user.username }); // delete all refresh tokens with the same username
  } catch (err) {
    console.error(`error when logout: ${err.message} \n${err}`);
    // commented for bugfix #101
    // throw createError(400, err.message);
  }
};

/**
 * removes expired refresh tokens from database
 */
exports.removeExpiredToken = async () => {
  const now = parseInt(Date.now() / 1000); // timestamp in s
  try {
    const tokens = await Token.find();
    tokens.forEach((jwt) => {
      const payload = jwt.token.split('.')[1];
      const token = JSON.parse(Buffer.from(payload, 'base64').toString('ascii'));
      if (parseInt(token.exp), now - token.exp > 0) {
        console.log(`refresh token expired and will be deleted now: (${JSON.stringify(token)})`);
        jwt.remove();
      } else {
        console.log(`refresh token NOT yet expired and will not be deleted now: (${JSON.stringify(token)})`);
      }
    });
  } catch (err) {
    console.log(err);
    throw createError(500, err.message);
  }
};

exports.removeTesterToken = async () => {
  await Token.deleteMany({ user: 'Tester' });
  await Token.deleteMany({ user: 'tester' });
};

exports.validateBasicAuth = async (authorization) => {
  if (!authorization) throw createError(401, 'Unauthorized; provide basic authentication');
  const method = authorization.split(' ')[0];
  if (method !== 'Basic') throw createError(401, 'Unauthorized; provide "Basic" authentication');
  const credentialsBase64 = authorization.split(' ')[1];
  const credentials = Buffer.from(credentialsBase64, 'base64').toString();
  const username = credentials.split(':')[0];
  const password = credentials.split(':')[1];
  // console.log(user, password);

  const mdbUser = await User.findOne({ username: { $eq: username } });
  if (mdbUser === null) throw createError(401, 'User not authenticated');

  if (!(await bcrypt.compare(password, mdbUser.password))) throw createError(401, 'User not authenticated');
};
