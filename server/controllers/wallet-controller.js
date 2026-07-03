const { sendResponse, throwErrorResponse, paginatedResponse } = require('../utils/response');
const walletService = require('../services/wallet-service');

class WalletController {
  static getBalance = async (req, res) => {
    try {
      const response = await walletService.getBalance({
        publicId: req.user.publicId,
        displayCurrency: req.query.currency,
      });
      return sendResponse(res, 'success', {
        message: 'Balance fetched successfully',
        data: response,
      });
    } catch (err) {
      return throwErrorResponse(req, res, err);
    }
  };

  static addFunds = async (req, res) => {
    try {
      const response = await walletService.addFunds({ publicId: req.user.publicId, ...req.body });
      return sendResponse(res, 'success', {
        message: response.idempotent ? 'Request already processed' : 'Funds added successfully',
        data: response,
      });
    } catch (err) {
      return throwErrorResponse(req, res, err);
    }
  };

  static withdraw = async (req, res) => {
    try {
      const response = await walletService.withdraw({ publicId: req.user.publicId, ...req.body });
      return sendResponse(res, 'success', {
        message: response.idempotent ? 'Request already processed' : 'Withdrawal successful',
        data: response,
      });
    } catch (err) {
      return throwErrorResponse(req, res, err);
    }
  };

  static transfer = async (req, res) => {
    try {
      const response = await walletService.transferFunds({ publicId: req.user.publicId, ...req.body });
      return sendResponse(res, 'success', {
        message: response.idempotent ? 'Request already processed' : 'Transfer successful',
        data: response,
      });
    } catch (err) {
      return throwErrorResponse(req, res, err);
    }
  };

  static history = async (req, res) => {
    try {
      const { page, perPage, type } = req.query;
      const { count, doc } = await walletService.getHistory({
        publicId: req.user.publicId,
        page,
        perPage,
        type,
      });
      return paginatedResponse(req, res, page, count, doc, perPage);
    } catch (err) {
      return throwErrorResponse(req, res, err);
    }
  };
}

module.exports = WalletController;
