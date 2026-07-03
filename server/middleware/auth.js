const { verifyToken } = require('../utils/jwt');
const { throwErrorResponse } = require('../utils/response');
const { APIError } = require('../exceptions');

const strictAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) throw APIError.Unauthorized('Missing authorization header');

    const token = authHeader.replace('Bearer ', '');
    const payload = verifyToken(token);

    req.user = {
      userId: payload.userId,
      publicId: payload.publicId,
      email: payload.email,
    };

    next();
  } catch (error) {
    return throwErrorResponse(req, res, error);
  }
};

module.exports = { strictAuth };
