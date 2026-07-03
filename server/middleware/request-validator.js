const { z } = require('zod');
const { sendResponse } = require('../utils/response');
const { HttpStatusCode } = require('../constants/status');

const zodValidation = (schema) => {
  return async (req, res, next) => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        params: req.params,
        query: req.query,
      });

      if (parsed.body) req.body = parsed.body;
      if (parsed.params) req.params = parsed.params;
      if (parsed.query) req.query = parsed.query;

      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return sendResponse(res, 'error', {
          status: HttpStatusCode.BAD_REQUEST,
          message: error.errors[0].message,
          data: {
            errors: error.issues.map((e) => ({
              key: e.path,
              message: e.message,
            })),
          },
        });
      }
      next(error);
    }
  };
};

module.exports = zodValidation;
