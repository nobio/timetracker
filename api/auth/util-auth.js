const mongoose = require('mongoose');

const User = mongoose.model('User');

const bcrypt = require('bcrypt');

users = []; // TODO: replace by database

exports.getAllUsers = async () => User.find();

exports.createUser = async (name, password) => {

  const user = await User.findOne({ name });

  return new Promise((resolve, reject) => {
    if (user) {
      reject({ message: 'User already exists' });
      return;
    }
    bcrypt
      .hash(password, 10)
      .then((hashedPassword) => {
        new User({
          name,
          password: hashedPassword,
        }).save();

        resolve({
          message: 'User created',
        });
      })
      .catch(err => reject(err));
  });
};

/** login with user and password (needs to be passed) */
exports.login = async (name, password) => {
  try {
    const user = await User.findOne({ name });

    if (user == null) {
      throw Error('Cannot find user');
    } else if (await bcrypt.compare(password, user.password)) {
      return ('User authenticated');
    } else {
      throw Error('User not authenticated');
    }
  } catch (err) {
    throw Error(err);
  }
};
