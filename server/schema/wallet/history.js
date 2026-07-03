const { z } = require('zod');

const historySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    perPage: z.coerce.number().int().positive().max(100).optional().default(10),
    type: z.enum(['credit', 'debit', 'transfer_in', 'transfer_out', 'withdrawal']).optional(),
  }),
});

module.exports = historySchema;
