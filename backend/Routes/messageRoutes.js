const express = require('express');
const { sendMessage, allMessages, deleteMessage } = require('../Controllers/messageControllers');

const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').post(protect, sendMessage);
router.route('/:chatId').get(protect, allMessages);
router.route('/:messageId').delete(protect, deleteMessage);

module.exports = router;