const express = require("express");
const verifyFirebaseToken = require("../middleware/auth");
const { getMyNotifications, markAsRead, markAllAsRead } = require("../controllers/notificationController");

const router = express.Router();

router.get("/", verifyFirebaseToken, getMyNotifications);
router.patch("/:id/read", verifyFirebaseToken, markAsRead);
router.patch("/read-all", verifyFirebaseToken, markAllAsRead);

module.exports = router;