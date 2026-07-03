const { env } = require('./constants/env');
const { createServer } = require('./utils/server');
const database = require('../database');
const { scheduleExchangeRateRefresh } = require('./services/fx-refresh-service');

async function main() {
  try {
    await database.authenticate();
    console.log('Database connected successfully');
  } catch (err) {
    console.error('Unable to connect to the database:', err.message);
    process.exit(1);
  }

  scheduleExchangeRateRefresh();

  const app = createServer();

  app.listen(env.PORT, '0.0.0.0', () => {
    console.log(`Digital Wallet API ready at http://localhost:${env.PORT}`);
  });

  process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    process.exit(1);
  });

  process.on('unhandledRejection', (err) => {
    console.error('Unhandled rejection:', err);
    process.exit(1);
  });
}

main();
