const express = require('express');
const { sendMessage, allMessages, deleteMessage } = require('../Controllers/messageControllers');

const { protect } = require('../middleware/authMiddleware');
const { rateLimit } = require('../middleware/rateLimiter');

const router = express.Router();

router.route('/').post(protect, rateLimit({ windowMs: 60_000, max: 30 }), sendMessage);
router.route('/:chatId').get(protect, allMessages);
router.route('/:messageId').delete(protect, deleteMessage);
module.exports = router;
