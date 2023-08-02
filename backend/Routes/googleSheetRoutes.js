const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { saveToSheet } = require('../Controllers/googleSheetController');

const router = express.Router();

router.route('/save-to-sheet').post(protect, saveToSheet);
module.exports = router;