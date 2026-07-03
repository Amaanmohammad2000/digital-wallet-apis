const { redis } = require('../config/redis');
const { APIError } = require('../exceptions');
const {
  FRAUD_WINDOW_SECONDS,
  FRAUD_MAX_HIGH_VALUE_TXNS,
  FRAUD_HIGH_VALUE_RATIO,
} = require('../constants/settings');

const dailySpendKey = (userId) => {
  const today = new Date().toISOString().slice(0, 10);
  return `daily-spend:${userId}:${today}`;
};

const velocityKey = (userId) => `txn-velocity:${userId}`;

const assertWithinDailyLimit = async (userId, amount, dailyLimit) => {
  const key = dailySpendKey(userId);
  const currentSpend = parseFloat((await redis.get(key)) || 0);

  if (currentSpend + amount > dailyLimit) {
    throw APIError.BadRequest(
      `Daily transaction limit exceeded. Limit: ${dailyLimit}, already spent today: ${currentSpend}`
    );
  }
};

const recordSpend = async (userId, amount) => {
  const key = dailySpendKey(userId);
  const newTotal = await redis.incrbyfloat(key, amount);

  if (parseFloat(newTotal) === parseFloat(amount)) {
    await redis.expire(key, 24 * 60 * 60);
  }
};

const checkSuspiciousVelocity = async (userId, amount, dailyLimit) => {
  const isHighValue = amount >= dailyLimit * FRAUD_HIGH_VALUE_RATIO;
  if (!isHighValue) return false;

  const key = velocityKey(userId);
  const now = Date.now();
  const windowStart = now - FRAUD_WINDOW_SECONDS * 1000;

  await redis.zremrangebyscore(key, 0, windowStart);
  await redis.zadd(key, now, `${now}`);
  await redis.expire(key, FRAUD_WINDOW_SECONDS);

  const countInWindow = await redis.zcard(key);

  return countInWindow > FRAUD_MAX_HIGH_VALUE_TXNS;
};

module.exports = {
  assertWithinDailyLimit,
  recordSpend,
  checkSuspiciousVelocity,
};
