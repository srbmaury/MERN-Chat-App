const express = require("express");
const { registerUser, verifyEmail, authUser, allUsers, updateProfilePicture, submitForReview, foulsIncrease, fetchSubmitForReview, review } = require('../Controllers/userControllers');
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route('/').post(registerUser).get(protect ,allUsers);
router.post('/login', authUser);
router.route('/update').put(protect, updateProfilePicture);
router.route("/foulsIncrease").post(protect, foulsIncrease);
router.route("/submitForReview").post(protect, submitForReview);
router.route("/submittedForReview").get(protect, fetchSubmitForReview);
router.route("/review").post(protect, review);
router.get("/verify/:token", verifyEmail);

module.exports = router;