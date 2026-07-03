const { HttpStatusCode } = require('./constants/status');
const {
  ValidationError,
  UniqueConstraintError,
  ForeignKeyConstraintError,
  DatabaseError,
  ConnectionError,
  BaseError,
} = require('sequelize');

class APIError extends Error {
  constructor(message, statusCode, name) {
    super(name);
    this.message = message;
    this.name = name || 'APIError';
    this.statusCode = statusCode;
  }

  static Conflict(message) {
    return new APIError(message, HttpStatusCode.CONFLICT, 'APIError::Conflict');
  }

  static BadRequest(message) {
    return new APIError(message, HttpStatusCode.BAD_REQUEST, 'APIError::BadRequest');
  }

  static ServerError(message) {
    return new APIError(message, HttpStatusCode.INTERNAL_SERVER_ERROR, 'APIError::ServerError');
  }

  static NotFound(message) {
    return new APIError(message, HttpStatusCode.NOT_FOUND, 'APIError::NotFound');
  }

  static Unauthorized(message = 'unauthorized') {
    return new APIError(message, HttpStatusCode.UNAUTHORIZED, 'APIError::Unauthorized');
  }

  static Forbidden(message) {
    return new APIError(message, HttpStatusCode.FORBIDDEN, 'APIError::Forbidden');
  }

  static TooManyRequests(message) {
    return new APIError(message, HttpStatusCode.TOO_MANY_REQUESTS, 'APIError::TooManyRequests');
  }
}

const isSequelizeError = (error) => error instanceof BaseError;

const handleSequelizeError = (error) => {
  let message = '';
  let httpStatus = HttpStatusCode.INTERNAL_SERVER_ERROR;

  switch (true) {
    case error instanceof ValidationError:
      message = error.errors.map((err) => err.message).join(', ');
      httpStatus = HttpStatusCode.BAD_REQUEST;
      break;
    case error instanceof UniqueConstraintError:
      message = `Duplicate entry for field(s): ${Object.keys(error.fields || {}).join(', ')}`;
      httpStatus = HttpStatusCode.CONFLICT;
      break;
    case error instanceof ForeignKeyConstraintError:
      message = `Foreign key constraint error: ${error.message}`;
      httpStatus = HttpStatusCode.BAD_REQUEST;
      break;
    case error instanceof DatabaseError:
    case error instanceof ConnectionError:
      message = `Database or connection error: ${error.message}`;
      httpStatus = HttpStatusCode.INTERNAL_SERVER_ERROR;
      break;
    default:
      message = `Unexpected database error: ${error.message}`;
      break;
  }

  return { message, httpStatus };
};

class ServiceErrorHandler extends Error {
  constructor(error, name = 'ServiceError') {
    super(error.message);
    this.name = name;
    this.originalError = error;

    const { message, httpStatus } = isSequelizeError(error)
      ? handleSequelizeError(error)
      : {
          message: error.message || 'Unhandled Service Error',
          httpStatus: error.statusCode || HttpStatusCode.INTERNAL_SERVER_ERROR,
        };

    this.message = message;
    this.httpStatus = httpStatus;

    console.error(`[${this.name}]`, this.message, this.originalError.stack);
  }
}

module.exports = {
  APIError,
  ServiceErrorHandler,
  handleSequelizeError,
  isSequelizeError,
};
