const { v4: uuidv4 } = require('uuid');
const {
  user: UserModel,
  wallet: WalletModel,
  transaction: TransactionModel,
  sequelize,
} = require('../../database');
const { APIError, ServiceErrorHandler } = require('../exceptions');
const { TRANSACTION_TYPES, TRANSACTION_STATUS } = require('../constants/settings');
const fxService = require('./fx-service');
const fraudService = require('./fraud-service');

const getBalance = async ({ publicId, displayCurrency }) => {
  try {
    const wallet = await WalletModel.findOne({ where: { user_id: publicId } });
    if (!wallet) throw APIError.NotFound('Wallet not found');

    const currency = displayCurrency || wallet.currency;
    const balance = await fxService.fromBaseCurrency(parseFloat(wallet.balance), currency);
    const dailyLimit = await fxService.fromBaseCurrency(parseFloat(wallet.daily_limit), currency);

    return {
      walletId: wallet.public_id,
      balance,
      currency,
      dailyLimit,
    };
  } catch (err) {
    if (err instanceof APIError) throw err;
    throw new ServiceErrorHandler(err, 'WalletService::getBalance');
  }
};

const findExistingByReference = async (referenceId) =>
  TransactionModel.findOne({ where: { reference_id: referenceId } });

const addFunds = async ({ publicId, amount, currency, referenceId }) => {
  const transaction = await sequelize.transaction();

  try {
    const existing = await findExistingByReference(referenceId);
    if (existing) {
      await transaction.rollback();
      return { idempotent: true, transactionId: existing.public_id };
    }

    const wallet = await WalletModel.findOne({
      where: { user_id: publicId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!wallet) throw APIError.NotFound('Wallet not found');

    const baseAmount = await fxService.toBaseCurrency(amount, currency);

    wallet.balance = parseFloat(wallet.balance) + baseAmount;
    await wallet.save({ transaction });

    const txn = await TransactionModel.create(
      {
        public_id: uuidv4(),
        wallet_id: wallet.public_id,
        type: TRANSACTION_TYPES.CREDIT,
        amount: baseAmount,
        display_amount: amount,
        currency,
        status: TRANSACTION_STATUS.SUCCESS,
        reference_id: referenceId,
      },
      { transaction }
    );

    await transaction.commit();

    return {
      transactionId: txn.public_id,
      newBalance: await fxService.fromBaseCurrency(parseFloat(wallet.balance), wallet.currency),
      currency: wallet.currency,
    };
  } catch (err) {
    if (transaction.finished !== 'commit') await transaction.rollback();
    if (err instanceof APIError) throw err;
    throw new ServiceErrorHandler(err, 'WalletService::addFunds');
  }
};

const withdraw = async ({ publicId, amount, currency, referenceId }) => {
  const transaction = await sequelize.transaction();

  try {
    const existing = await findExistingByReference(referenceId);
    if (existing) {
      await transaction.rollback();
      return { idempotent: true, transactionId: existing.public_id };
    }

    const wallet = await WalletModel.findOne({
      where: { user_id: publicId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!wallet) throw APIError.NotFound('Wallet not found');

    const baseAmount = await fxService.toBaseCurrency(amount, currency);

    if (parseFloat(wallet.balance) < baseAmount) {
      throw APIError.BadRequest('Insufficient balance');
    }

    const dailyLimit = parseFloat(wallet.daily_limit);
    await fraudService.assertWithinDailyLimit(publicId, baseAmount, dailyLimit);

    const isSuspicious = await fraudService.checkSuspiciousVelocity(publicId, baseAmount, dailyLimit);

    wallet.balance = parseFloat(wallet.balance) - baseAmount;
    await wallet.save({ transaction });

    const txn = await TransactionModel.create(
      {
        public_id: uuidv4(),
        wallet_id: wallet.public_id,
        type: TRANSACTION_TYPES.WITHDRAWAL,
        amount: baseAmount,
        display_amount: amount,
        currency,
        status: isSuspicious ? TRANSACTION_STATUS.FLAGGED : TRANSACTION_STATUS.SUCCESS,
        reference_id: referenceId,
      },
      { transaction }
    );

    await transaction.commit();

    await fraudService.recordSpend(publicId, baseAmount);

    return {
      transactionId: txn.public_id,
      newBalance: await fxService.fromBaseCurrency(parseFloat(wallet.balance), wallet.currency),
      currency: wallet.currency,
      flagged: isSuspicious,
    };
  } catch (err) {
    if (transaction.finished !== 'commit') await transaction.rollback();
    if (err instanceof APIError) throw err;
    throw new ServiceErrorHandler(err, 'WalletService::withdraw');
  }
};

const transferFunds = async ({ publicId, toPhoneNumber, amount, currency, referenceId }) => {
  const transaction = await sequelize.transaction();

  try {
    const existing = await findExistingByReference(referenceId);
    if (existing) {
      await transaction.rollback();
      return { idempotent: true, transactionId: existing.public_id };
    }

    const recipient = await UserModel.findOne({ where: { phone_number: toPhoneNumber }, transaction });
    if (!recipient) throw APIError.NotFound('Recipient not found');
    if (recipient.public_id === publicId) throw APIError.BadRequest('Cannot transfer funds to yourself');

    const [firstId, secondId] = [publicId, recipient.public_id].sort();

    const firstWallet = await WalletModel.findOne({
      where: { user_id: firstId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    const secondWallet = await WalletModel.findOne({
      where: { user_id: secondId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    const fromWallet = firstWallet.user_id === publicId ? firstWallet : secondWallet;
    const toWallet = firstWallet.user_id === publicId ? secondWallet : firstWallet;

    if (!fromWallet || !toWallet) throw APIError.NotFound('Wallet not found');

    const baseAmount = await fxService.toBaseCurrency(amount, currency);

    if (parseFloat(fromWallet.balance) < baseAmount) {
      throw APIError.BadRequest('Insufficient balance');
    }

    const dailyLimit = parseFloat(fromWallet.daily_limit);
    await fraudService.assertWithinDailyLimit(publicId, baseAmount, dailyLimit);
    const isSuspicious = await fraudService.checkSuspiciousVelocity(publicId, baseAmount, dailyLimit);

    fromWallet.balance = parseFloat(fromWallet.balance) - baseAmount;
    toWallet.balance = parseFloat(toWallet.balance) + baseAmount;

    await fromWallet.save({ transaction });
    await toWallet.save({ transaction });

    const status = isSuspicious ? TRANSACTION_STATUS.FLAGGED : TRANSACTION_STATUS.SUCCESS;

    const outTxn = await TransactionModel.create(
      {
        public_id: uuidv4(),
        wallet_id: fromWallet.public_id,
        counterparty_wallet_id: toWallet.public_id,
        type: TRANSACTION_TYPES.TRANSFER_OUT,
        amount: baseAmount,
        display_amount: amount,
        currency,
        status,
        reference_id: referenceId,
      },
      { transaction }
    );

    await TransactionModel.create(
      {
        public_id: uuidv4(),
        wallet_id: toWallet.public_id,
        counterparty_wallet_id: fromWallet.public_id,
        type: TRANSACTION_TYPES.TRANSFER_IN,
        amount: baseAmount,
        display_amount: amount,
        currency,
        status,
        reference_id: `${referenceId}-in`,
      },
      { transaction }
    );

    await transaction.commit();

    await fraudService.recordSpend(publicId, baseAmount);

    return {
      transactionId: outTxn.public_id,
      newBalance: await fxService.fromBaseCurrency(parseFloat(fromWallet.balance), fromWallet.currency),
      currency: fromWallet.currency,
      flagged: isSuspicious,
    };
  } catch (err) {
    if (transaction.finished !== 'commit') await transaction.rollback();
    if (err instanceof APIError) throw err;
    throw new ServiceErrorHandler(err, 'WalletService::transferFunds');
  }
};

const getHistory = async ({ publicId, page, perPage, type }) => {
  try {
    const wallet = await WalletModel.findOne({ where: { user_id: publicId } });
    if (!wallet) throw APIError.NotFound('Wallet not found');

    const where = { wallet_id: wallet.public_id, ...(type && { type }) };
    const limit = perPage;
    const offset = (page - 1) * perPage;

    const { count, rows } = await TransactionModel.findAndCountAll({
      where,
      include: [
        {
          model: WalletModel,
          as: 'counterpartyWallet',
          required: false,
          include: [{ model: UserModel, attributes: ['name', 'phone_number'] }],
        },
      ],
      order: [['created_at', 'DESC']],
      limit,
      offset,
    });

    const doc = rows.map((row) => ({
      id: row.public_id,
      type: row.type,
      amount: parseFloat(row.display_amount),
      currency: row.currency,
      status: row.status,
      createdAt: row.created_at,
      counterparty: row.counterpartyWallet?.user
        ? {
            name: row.counterpartyWallet.user.name,
            phoneNumber: row.counterpartyWallet.user.phone_number,
          }
        : null,
    }));

    return { count, doc };
  } catch (err) {
    if (err instanceof APIError) throw err;
    throw new ServiceErrorHandler(err, 'WalletService::getHistory');
  }
};

module.exports = { getBalance, addFunds, withdraw, transferFunds, getHistory };
