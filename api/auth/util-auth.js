const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const User = mongoose.model('User');

exports.getAllUsers = async () => User.find();

/**
 * creates a new user in database
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

/** login with user and password (needs to be passed) */
exports.login = async (name, password) => {
  if (!name) throw Error('User must be provided');
  if (!password) throw Error('No password provided');

  const user = await User.findOne({ name });

  if (user == null) throw Error('User not authenticated');
  if (await bcrypt.compare(password, user.password)) {
    return 'User authenticated';
  }
  throw Error('User not authenticated');
};
