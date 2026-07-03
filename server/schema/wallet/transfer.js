const { z } = require('zod');
const { currencyCode, positiveAmount, phoneNumber } = require('../custom');

const transferSchema = z.object({
  body: z.object({
    toPhoneNumber: phoneNumber,
    amount: positiveAmount,
    currency: currencyCode,
    referenceId: z.string({ required_error: 'referenceId is required for idempotency' }).uuid(),
  }),
});

module.exports = transferSchema;
