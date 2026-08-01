const express = require('express');
const router = express.Router();
const { searchPhotos } = require('../Controllers/unsplashController');
const { protect } = require('../middleware/authMiddleware');
const { rateLimit } = require('../middleware/rateLimiter');

router.route('/').get(protect, rateLimit({ windowMs: 60_000, max: 30 }), searchPhotos);

module.exports = router;
