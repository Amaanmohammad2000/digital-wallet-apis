const { Router } = require('express');
const WalletController = require('../controllers/wallet-controller');
const zodValidation = require('../middleware/request-validator');
const { strictAuth } = require('../middleware/auth');
const { rateLimiter } = require('../middleware/rate-limiter');
const { addFundsSchema, transferSchema, withdrawSchema, historySchema } = require('../schema/wallet');

const walletRouter = Router();

walletRouter.use(strictAuth);

walletRouter.get('/balance', WalletController.getBalance);
walletRouter.get('/transactions', zodValidation(historySchema), WalletController.history);

walletRouter.post('/add-funds', rateLimiter(), zodValidation(addFundsSchema), WalletController.addFunds);
walletRouter.post('/withdraw', rateLimiter(), zodValidation(withdrawSchema), WalletController.withdraw);
walletRouter.post('/transfer', rateLimiter(), zodValidation(transferSchema), WalletController.transfer);

module.exports = walletRouter;
