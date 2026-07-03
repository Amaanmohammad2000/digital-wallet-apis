const { z } = require('zod');

const uuidRegExp = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const currencyCode = z
  .string({ required_error: 'currency is required' })
  .length(3, 'currency must be a 3-letter ISO code')
  .transform((val) => val.toUpperCase());

const positiveAmount = z
  .number({ required_error: 'amount is required', invalid_type_error: 'amount must be a number' })
  .positive('amount must be greater than 0');

const phoneNumber = z
  .string({ required_error: 'phoneNumber is required' })
  .regex(/^\+?[1-9]\d{7,14}$/, 'phoneNumber must be a valid number in E.164 format, e.g. +919876543210');

const strongPassword = z
  .string({ required_error: 'password is required' })
  .min(8, 'password must be at least 8 characters')
  .regex(/[a-z]/, 'password must contain at least one lowercase letter')
  .regex(/[A-Z]/, 'password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'password must contain at least one number')
  .regex(/[^a-zA-Z0-9]/, 'password must contain at least one special character');

module.exports = { uuidRegExp, currencyCode, positiveAmount, phoneNumber, strongPassword };
