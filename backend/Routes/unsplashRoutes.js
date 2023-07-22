const express = require('express');
const router = express.Router();
const { searchPhotos } = require('../Controllers/unsplashController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect,searchPhotos);

module.exports = router;
