const express = require("express");
const verifyFirebaseToken = require("../middleware/auth");
const { getMySummary } = require("../controllers/analyticsController");

const router = express.Router();

router.get("/summary", verifyFirebaseToken, getMySummary);

module.exports = router;