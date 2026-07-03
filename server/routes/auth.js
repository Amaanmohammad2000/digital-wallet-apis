const { Router } = require('express');
const AuthController = require('../controllers/auth-controller');
const zodValidation = require('../middleware/request-validator');
const { strictAuth } = require('../middleware/auth');
const { ipRateLimiter } = require('../middleware/rate-limiter');
const { registerSchema, loginSchema } = require('../schema/auth');

const authRouter = Router();

authRouter.post('/register', ipRateLimiter(), zodValidation(registerSchema), AuthController.register);
authRouter.post('/login', ipRateLimiter(), zodValidation(loginSchema), AuthController.login);
authRouter.get('/profile', strictAuth, AuthController.getCurrentUser);

module.exports = authRouter;
