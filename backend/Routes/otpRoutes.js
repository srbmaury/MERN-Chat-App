// Import necessary dependencies and models
const express = require('express');
const router = express.Router();
const { generateOTP, verifyOTP } = require('../Controllers/otpController');
const { rateLimit } = require('../middleware/rateLimiter');

router.post('/generate', rateLimit({ windowMs: 60 * 60 * 1000, max: 5 }), generateOTP);
router.post('/verify', rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }), verifyOTP);

module.exports = router;
