const { v4: uuidv4 } = require('uuid');
const { Op } = require('sequelize');
const { user: UserModel, wallet: WalletModel, sequelize } = require('../../database');
const { hashPassword, verifyPassword } = require('../utils/hashes');
const { signToken } = require('../utils/jwt');
const { APIError, ServiceErrorHandler } = require('../exceptions');
const { env } = require('../constants/env');
const fxService = require('./fx-service');

const register = async ({ name, email, phoneNumber, password, defaultCurrency }) => {
  const transaction = await sequelize.transaction();

  try {
    const existing = await UserModel.findOne({ where: { [Op.or]: [{ email }, { phone_number: phoneNumber }] } });
    if (existing) {
      throw APIError.Conflict(
        existing.email === email
          ? 'An account with this email already exists'
          : 'An account with this phone number already exists'
      );
    }

    const passwordHash = await hashPassword(password);
    const currency = defaultCurrency || env.DEFAULT_CURRENCY;

    const user = await UserModel.create(
      {
        public_id: uuidv4(),
        name,
        email,
        phone_number: phoneNumber,
        password_hash: passwordHash,
        default_currency: currency,
      },
      { transaction }
    );

    const wallet = await WalletModel.create(
      {
        public_id: uuidv4(),
        user_id: user.public_id,
        currency,
        balance: 0,
        daily_limit: env.DEFAULT_DAILY_LIMIT,
      },
      { transaction }
    );

    const token = signToken({ userId: user.id, publicId: user.public_id, email: user.email });

    await transaction.commit();

    return {
      token,
      user: {
        id: user.public_id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phone_number,
        defaultCurrency: user.default_currency,
      },
      wallet: {
        id: wallet.public_id,
        balance: parseFloat(wallet.balance),
        currency: wallet.currency,
      },
    };
  } catch (err) {
    if (transaction.finished !== 'commit') await transaction.rollback();
    if (err instanceof APIError) throw err;
    throw new ServiceErrorHandler(err, 'AuthService::register');
  }
};

const login = async ({ phoneNumber, password }) => {
  try {
    const user = await UserModel.findOne({ where: { phone_number: phoneNumber } });
    if (!user) throw APIError.Unauthorized('Invalid phone number or password');

    const isMatch = await verifyPassword(user.password_hash, password);
    if (!isMatch) throw APIError.Unauthorized('Invalid phone number or password');

    const token = signToken({ userId: user.id, publicId: user.public_id, email: user.email });

    return {
      token,
      user: {
        id: user.public_id,
        name: user.name,
        email: user.email,
        phoneNumber: user.phone_number,
        defaultCurrency: user.default_currency,
      },
    };
  } catch (err) {
    if (err instanceof APIError) throw err;
    throw new ServiceErrorHandler(err, 'AuthService::login');
  }
};

const getCurrentUser = async ({ userId }) => {
  try {
    const user = await UserModel.findByPk(userId, {
      include: [{ model: WalletModel }],
    });

    if (!user) throw APIError.NotFound('User not found');

    let wallet = null;
    if (user.wallet) {
      const currency = user.wallet.currency;
      wallet = {
        id: user.wallet.public_id,
        balance: await fxService.fromBaseCurrency(parseFloat(user.wallet.balance), currency),
        currency,
        dailyLimit: await fxService.fromBaseCurrency(parseFloat(user.wallet.daily_limit), currency),
      };
    }

    return {
      id: user.public_id,
      name: user.name,
      email: user.email,
      phoneNumber: user.phone_number,
      defaultCurrency: user.default_currency,
      wallet,
    };
  } catch (err) {
    if (err instanceof APIError) throw err;
    throw new ServiceErrorHandler(err, 'AuthService::getCurrentUser');
  }
};

module.exports = { register, login, getCurrentUser };
