const bcrypt = require('bcrypt');
const { APIError } = require('../exceptions');

const SALT_ROUNDS = 10;

const hashPassword = async (password) => {
  try {
    return await bcrypt.hash(password, SALT_ROUNDS);
  } catch (e) {
    throw APIError.ServerError('Failed to hash password');
  }
};

const verifyPassword = async (hash, password) => {
  try {
    return await bcrypt.compare(password, hash);
  } catch (e) {
    throw APIError.Unauthorized('Invalid credentials');
  }
};

module.exports = { hashPassword, verifyPassword };
