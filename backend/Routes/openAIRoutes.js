const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { smartReply } = require('../Controllers/openAIController');

router.route('/smartReply').post(protect, smartReply);

module.exports = router;
