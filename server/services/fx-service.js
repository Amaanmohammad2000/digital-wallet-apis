const { exchange_rate: ExchangeRateModel } = require('../../database');
const { redis } = require('../config/redis');
const { APIError } = require('../exceptions');
const { FX_CACHE_TTL_SECONDS } = require('../constants/settings');

const BASE_CURRENCY = 'INR';

const cacheKey = (targetCurrency) => `fx-rate:${BASE_CURRENCY}:${targetCurrency}`;

const getRate = async (targetCurrency) => {
  if (targetCurrency === BASE_CURRENCY) return 1;

  const cached = await redis.get(cacheKey(targetCurrency)).catch(() => null);
  if (cached !== null) return parseFloat(cached);

  const row = await ExchangeRateModel.findOne({
    where: { base_currency: BASE_CURRENCY, target_currency: targetCurrency },
  });

  if (!row) throw APIError.BadRequest(`Unsupported currency: ${targetCurrency}`);

  const rate = parseFloat(row.rate);
  await redis.set(cacheKey(targetCurrency), rate, 'EX', FX_CACHE_TTL_SECONDS).catch(() => {});

  return rate;
};

const setRate = async (targetCurrency, rate) => {
  await ExchangeRateModel.upsert({
    base_currency: BASE_CURRENCY,
    target_currency: targetCurrency,
    rate,
    updated_at: new Date(),
  });

  await redis.set(cacheKey(targetCurrency), rate, 'EX', FX_CACHE_TTL_SECONDS).catch(() => {});
};

const toBaseCurrency = async (amount, currency) => {
  if (currency === BASE_CURRENCY) return amount;
  const rate = await getRate(currency);
  return Math.round((amount / rate) * 100) / 100;
};

const fromBaseCurrency = async (amount, currency) => {
  if (currency === BASE_CURRENCY) return amount;
  const rate = await getRate(currency);
  return Math.round(amount * rate * 100) / 100;
};

module.exports = { BASE_CURRENCY, getRate, setRate, toBaseCurrency, fromBaseCurrency };
