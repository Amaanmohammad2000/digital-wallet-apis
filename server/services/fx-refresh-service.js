const axios = require('axios');
const cron = require('node-cron');
const { env } = require('../constants/env');
const { redis } = require('../config/redis');
const fxService = require('./fx-service');

const REFRESH_LOCK_KEY = 'fx-refresh:lock';

const refreshExchangeRates = async () => {
  try {
    const acquiredLock = await redis
      .set(REFRESH_LOCK_KEY, '1', 'EX', env.FX_REFRESH_COOLDOWN_SECONDS, 'NX')
      .catch(() => 'OK');

    if (!acquiredLock) {
      console.log('Skipping exchange rate refresh — already refreshed within the last cooldown window');
      return;
    }

    const response = await axios.get(`${env.FX_PROVIDER_URL}/${fxService.BASE_CURRENCY}`);
    const liveRates = response.data.rates || {};

    const currenciesToUpdate = Object.keys(liveRates).filter(
      (currency) => currency !== fxService.BASE_CURRENCY
    );

    await Promise.all(
      currenciesToUpdate.map((currency) => fxService.setRate(currency, liveRates[currency]))
    );

    console.log(`Exchange rates refreshed from live provider for ${currenciesToUpdate.length} currencies`);
  } catch (err) {
    console.error('Exchange rate refresh failed, continuing with last known rates:', err.message);
  }
};

const scheduleExchangeRateRefresh = (cronExpression = env.FX_REFRESH_CRON) => {
  refreshExchangeRates();
  return cron.schedule(cronExpression, refreshExchangeRates);
};

module.exports = { refreshExchangeRates, scheduleExchangeRateRefresh };
