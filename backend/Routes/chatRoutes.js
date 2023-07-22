const express = require('express');
const { accessChat, fetchChats, createGroupChat, renameGroup, addToGroup, removeFromGroup, deleteChat, muteChat, mutedChats, updateWallpaper, updateWallpaperForAllChats } = require('../Controllers/chatControllers');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/').post(protect, accessChat);
router.route('/').get(protect, fetchChats);
router.route('/group').post(protect, createGroupChat);
router.route('/rename').put(protect, renameGroup);
router.route('/wallpaper/:chatId').post(protect, updateWallpaper);
router.route('/wallpaper').post(protect, updateWallpaperForAllChats);
router.route('/groupadd').put(protect, addToGroup);
router.route('/groupremove').put(protect, removeFromGroup);
router.route('/:chatId').delete(protect, deleteChat);
router.route('/:chatId').post(protect, muteChat);
router.route('/muted').get(protect, mutedChats);
module.exports = router;