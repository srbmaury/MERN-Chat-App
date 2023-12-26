const express = require("express");
const { createStatus, getStatuses, getStatusById, deleteStatus } = require("../Controllers/statusController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.route("/")
  .post(protect, createStatus)
  .get(protect, getStatuses);

router.route("/:statusId")
  .get(getStatusById)
  .delete(protect, deleteStatus);

module.exports = router;
