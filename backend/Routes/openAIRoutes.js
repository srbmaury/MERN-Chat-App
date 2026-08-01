const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { smartReply } = require('../Controllers/openAIController');
const { rateLimit } = require('../middleware/rateLimiter');

router.route('/smartReply').post(protect, rateLimit({ windowMs: 60_000, max: 5 }), smartReply);

module.exports = router;
