require('dotenv').config();
const { cleanEnv, str, port, num, makeValidator } = require('envalid');
const cron = require('node-cron');

const cronExpression = makeValidator((value) => {
  if (!cron.validate(value)) {
    throw new Error(`"${value}" is not a valid cron expression`);
  }
  return value;
});

const env = cleanEnv(process.env, {
  PORT: port({ default: 4000 }),
  NODE_ENV: str({ default: 'development' }),

  DB_NAME: str(),
  DB_USER: str(),
  DB_PASSWORD: str(),
  DB_HOST: str({ default: 'localhost' }),
  DB_PORT: port({ default: 5432 }),
  DB_SCHEMA: str({ default: 'wallet' }),

  REDIS_HOST: str({ default: 'localhost' }),
  REDIS_PORT: port({ default: 6379 }),

  JWT_SECRET: str(),
  JWT_EXPIRY: str({ default: '1d' }),
  JWT_ISSUER: str({ default: 'digital-wallet-apis' }),

  DEFAULT_CURRENCY: str({ default: 'INR' }),
  DEFAULT_DAILY_LIMIT: num({ default: 500000 }),

  FX_PROVIDER_URL: str({ default: 'https://open.er-api.com/v6/latest' }),
  FX_REFRESH_CRON: cronExpression({ default: '0 */6 * * *' }),
  FX_REFRESH_COOLDOWN_SECONDS: num({ default: 300 }),
});

module.exports = { env };
