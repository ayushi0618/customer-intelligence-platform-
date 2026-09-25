/**
 * Authentication Routes
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth');
const rateLimit = require('express-rate-limit');

// Rate limiting for login route to protect against brute-force attacks
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 attempts per IP per window
  message: {
    success: false,
    error: {
      code: 'TOO_MANY_REQUESTS',
      message: 'Too many login attempts from this IP. Please try again after 15 minutes.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false
});

router.post('/login', loginLimiter, (req, res, next) => authController.login(req, res, next));
router.get('/me', authenticateToken, (req, res, next) => authController.me(req, res, next));

module.exports = router;
