const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const { EXPOSED_HEADERS } = require('../constants/settings');
const { throwErrorResponse, sendResponse } = require('../utils/response');
const { HttpStatusCode } = require('../constants/status');

const authRouter = require('../routes/auth');
const walletRouter = require('../routes/wallet');

function createServer() {
  const app = express();

  app.set('trust proxy', true);
  app.use(cors({ exposedHeaders: EXPOSED_HEADERS }));
  app.use(helmet());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(morgan('dev'));

  const versionPrefix = '/api/v1';

  app.get(`${versionPrefix}/health`, (req, res) =>
    sendResponse(res, 'success', { message: 'ok', data: { uptime: process.uptime() } })
  );

  app.use(`${versionPrefix}/auth`, authRouter);
  app.use(`${versionPrefix}/wallet`, walletRouter);

  app.use((req, res) =>
    sendResponse(res, 'error', {
      status: HttpStatusCode.NOT_FOUND,
      message: 'Route not found',
    })
  );

  app.use((err, req, res, next) => throwErrorResponse(req, res, err));

  return app;
}

module.exports = { createServer };
