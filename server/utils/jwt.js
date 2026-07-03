const jwt = require('jsonwebtoken');
const { env } = require('../constants/env');
const { APIError } = require('../exceptions');

const signToken = (payload) =>
  jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRY,
    issuer: env.JWT_ISSUER,
  });

const verifyToken = (token) => {
  try {
    return jwt.verify(token, env.JWT_SECRET, { issuer: env.JWT_ISSUER });
  } catch (e) {
    throw APIError.Unauthorized('Invalid or expired token');
  }
};

module.exports = { signToken, verifyToken };
