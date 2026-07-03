const { z } = require('zod');
const { currencyCode, positiveAmount } = require('../custom');

const addFundsSchema = z.object({
  body: z.object({
    amount: positiveAmount,
    currency: currencyCode,
    referenceId: z.string({ required_error: 'referenceId is required for idempotency' }).uuid(),
  }),
});

module.exports = addFundsSchema;
