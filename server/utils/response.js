const { HttpStatusCode } = require('../constants/status');
const { APIError, ServiceErrorHandler } = require('../exceptions');
const { ZodError } = require('zod');
const Sequelize = require('sequelize');
const jwt = require('jsonwebtoken');

const sendResponse = (res, type, options = {}) => {
  let { message, status, data } = options;

  if (!status) {
    status = type === 'success' ? HttpStatusCode.OK : HttpStatusCode.INTERNAL_SERVER_ERROR;
  }

  const response = {
    status,
    success: type === 'success',
    message,
  };

  if (data && data.count !== undefined) {
    res.setHeader('x-total-records', data.count);
    delete data.count;
  }

  if (data) response.data = data;

  return res.status(status).json(response).end();
};

const paginatedResponse = (req, res, currentPage, total, rows, perPage) => {
  const totalPages = Math.ceil(total / perPage);

  return sendResponse(res, 'success', {
    message: 'Successfully fetched',
    data: {
      rows,
      pagination: {
        currentPage,
        perPage,
        totalPages,
        totalRecords: total,
      },
    },
  });
};

const throwErrorResponse = (req, res, e) => {
  if (e instanceof APIError) {
    return sendResponse(res, 'error', {
      message: e.message,
      status: e.statusCode,
    });
  }

  if (e instanceof ServiceErrorHandler) {
    return sendResponse(res, 'error', {
      message: e.message,
      status: e.httpStatus,
    });
  }

  if (e instanceof Sequelize.BaseError) {
    const serviceError = new ServiceErrorHandler(e, 'SequelizeError');
    return sendResponse(res, 'error', {
      message: serviceError.message,
      status: serviceError.httpStatus,
    });
  }

  if (e instanceof jwt.JsonWebTokenError || e instanceof jwt.TokenExpiredError) {
    return sendResponse(res, 'error', {
      message: 'unauthorized',
      status: HttpStatusCode.UNAUTHORIZED,
    });
  }

  if (e instanceof ZodError) {
    return sendResponse(res, 'error', {
      status: HttpStatusCode.BAD_REQUEST,
      message: e.errors[0].message,
      data: {
        errors: e.issues.map((issue) => ({
          key: issue.path,
          message: issue.message,
        })),
      },
    });
  }

  console.error('Unhandled error', e);

  return sendResponse(res, 'error', {
    status: HttpStatusCode.INTERNAL_SERVER_ERROR,
    message: e.message || 'Something went wrong',
  });
};

module.exports = {
  sendResponse,
  throwErrorResponse,
  paginatedResponse,
};
