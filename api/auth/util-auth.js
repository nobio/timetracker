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

  return new Promise((resolve, reject) => {
    User.find()
      .then(res => {
        res.forEach(user => {
          users.push(
            {
              id: user._id,
              username: user.username,
              name: user.name,
              mailAddress: user.mailaddress,
            }
          )
        });
        resolve(users);
      })
      .catch(err => reject("cannot load users "));
  });
}

exports.getUser = async (id) => {
  if (!id) throw Error('id must be provided');

  return new Promise((resolve, reject) => {
    User.findById({ _id: id })
      .then(res => {
        resolve({
          id: res._id,
          username: res.username,
          name: res.name,
          mailAddress: res.mailaddress,
        })
      })
      .then(ret => resolve(ret))
      .catch(err => reject("cannot load user " + id));
  });

}

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
  return new Promise((resolve, reject) => {
    new User({
      username,
      password: hashedPassword,
      name,
      mailaddress: mailAddress
    }).save()
      .then(ret => resolve(ret._id))
      .catch(err => reject(err));
  });
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
  if (!id) throw Error('User must be provided');

  const user = await User.findById(id);
  if (!user) throw Error('User does not exists');

  if (username) user.username = username;
  if (name) user.name = name;
  if (mailAddress) user.mailaddress = mailAddress;

  return new Promise((resolve, reject) => {
    user.save()
      .then(ret => resolve(ret._id))
      .catch(err => reject(err));
  });
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
        .then(ret => resolve(ret._id))
        .catch(err => reject(err));
    });
      
  } catch (error) {
    throw Error('User does not exists');
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
      .then(res => res)
      .then(ret => resolve(ret))
      .catch(err => reject("cannot delete user " + id));
  });

}

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

  const mdbUser = await User.findOne({ username });
  if (mdbUser == null) throw createError(401, 'User not authenticated');

  if (!(await bcrypt.compare(password, mdbUser.password))) {
    throw createError(401);
  }
  const user = {
    username: mdbUser.username,
    mailAddress: mdbUser.mailaddress
  };

  const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRE });
  const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, { expiresIn: process.env.REFRESH_TOKEN_EXPIRE });

  new Token({
    token: refreshToken,
    user: mdbUser.username,
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
  accessToken = jwt.sign({ username: user.username }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: process.env.ACCESS_TOKEN_EXPIRE });

  return { accessToken, user };
};

/**
 * removes expired refresh tokens from database
 */
exports.removeExpiredToken = async () => {
  const now = parseInt(Date.now() / 1000);   // timestamp in s
  try {
    const tokens = await Token.find();
    tokens.forEach(jwt => {
      const payload = jwt.token.split('.')[1];
      const token = JSON.parse(Buffer.from(payload, 'base64').toString('ascii'));
      if (parseInt(token.exp), now - token.exp > 0) {
        console.log(`refresh token expired and will be deleted now: (${JSON.stringify(token)})`);
        jwt.remove();
      }
    });
  } catch (err) {
    console.log(err)
    return createError(500, err.message);
  }
};

exports.removeTesterToken = async () => {
  await Token.deleteMany({ user: 'Tester' });
};