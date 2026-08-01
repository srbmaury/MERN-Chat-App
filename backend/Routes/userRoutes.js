const express = require("express");
const { registerUser, verifyEmail, authUser, logoutUser, allUsers, updateProfilePicture, submitForReview, fetchSubmitForReview, review } = require('../Controllers/userControllers');
const { protect } = require("../middleware/authMiddleware");
const { rateLimit } = require("../middleware/rateLimiter");

const router = express.Router();

router.route('/').post(rateLimit({ windowMs: 60 * 60 * 1000, max: 10 }), registerUser).get(protect ,allUsers);
router.post('/login', rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }), authUser);
router.post('/logout', logoutUser);
router.route('/update').put(protect, updateProfilePicture);
router.route("/submitForReview").post(protect, rateLimit({ windowMs: 60 * 60 * 1000, max: 20 }), submitForReview);
router.route("/submittedForReview").get(protect, fetchSubmitForReview);
router.route("/review").post(protect, review);
router.get("/verify/:token", verifyEmail);

module.exports = router;
