const { sendResponse, throwErrorResponse } = require('../utils/response');
const { HttpStatusCode } = require('../constants/status');
const authService = require('../services/auth-service');

class AuthController {
  static register = async (req, res) => {
    try {
      const response = await authService.register(req.body);
      return sendResponse(res, 'success', {
        status: HttpStatusCode.CREATED,
        message: 'User registered successfully',
        data: response,
      });
    } catch (err) {
      return throwErrorResponse(req, res, err);
    }
  };

  static login = async (req, res) => {
    try {
      const response = await authService.login(req.body);
      return sendResponse(res, 'success', {
        message: 'Login successful',
        data: response,
      });
    } catch (err) {
      return throwErrorResponse(req, res, err);
    }
  };

  static getCurrentUser = async (req, res) => {
    try {
      const response = await authService.getCurrentUser({ userId: req.user.userId });
      return sendResponse(res, 'success', {
        message: 'User details fetched successfully',
        data: response,
      });
    } catch (err) {
      return throwErrorResponse(req, res, err);
    }
  };
}

module.exports = AuthController;
