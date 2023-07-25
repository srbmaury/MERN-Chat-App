const express = require("express");
const { registerUser, verifyEmail, authUser, allUsers, updateProfilePicture, submitForReview, foulsIncrease } = require('../Controllers/userControllers');
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route('/').post(registerUser).get(protect ,allUsers);
router.post('/login', authUser);
router.route('/update').put(protect, updateProfilePicture);
router.route("/foulsIncrease").post(protect, foulsIncrease);
router.route("/submitForReview").post(protect, submitForReview);
router.get("/verify/:token", verifyEmail);

module.exports = router;