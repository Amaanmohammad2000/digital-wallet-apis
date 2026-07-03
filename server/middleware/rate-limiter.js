const { redis } = require('../config/redis');
const { throwErrorResponse } = require('../utils/response');
const { APIError } = require('../exceptions');
const {
  RATE_LIMIT_WINDOW_SECONDS,
  RATE_LIMIT_MAX_REQUESTS,
  AUTH_RATE_LIMIT_WINDOW_SECONDS,
  AUTH_RATE_LIMIT_MAX_REQUESTS,
} = require('../constants/settings');

const enforceLimit = async (key, maxRequests, windowSeconds) => {
  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, windowSeconds);
  }

  if (current > maxRequests) {
    throw APIError.TooManyRequests(
      `Rate limit exceeded. Max ${maxRequests} requests per ${windowSeconds} seconds.`
    );
  }
};

const rateLimiter = (maxRequests = RATE_LIMIT_MAX_REQUESTS, windowSeconds = RATE_LIMIT_WINDOW_SECONDS) => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.userId;
      if (!userId) return next();

      const key = `rate-limit:${userId}:${req.baseUrl}${req.path}`;
      await enforceLimit(key, maxRequests, windowSeconds);

      next();
    } catch (error) {
      return throwErrorResponse(req, res, error);
    }
  };
};

const ipRateLimiter = (
  maxRequests = AUTH_RATE_LIMIT_MAX_REQUESTS,
  windowSeconds = AUTH_RATE_LIMIT_WINDOW_SECONDS
) => {
  return async (req, res, next) => {
    try {
      const key = `rate-limit:ip:${req.ip}:${req.baseUrl}${req.path}`;
      await enforceLimit(key, maxRequests, windowSeconds);

      next();
    } catch (error) {
      return throwErrorResponse(req, res, error);
    }
  };
};

module.exports = { rateLimiter, ipRateLimiter };
