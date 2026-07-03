const { z } = require('zod');
const { phoneNumber } = require('../custom');

const loginSchema = z.object({
  body: z.object({
    phoneNumber,
    password: z.string({ required_error: 'password is required' }).min(1),
  }),
});

module.exports = loginSchema;
