const express = require("express");
const verifyFirebaseToken = require("../middleware/auth");
const upload = require("../middleware/upload");
const {
  uploadProfilePhoto,
  registerProfile,
  loginSync,
  getCurrentUser
} = require("../controllers/authController");

const router = express.Router();

router.post("/upload-photo", verifyFirebaseToken, upload.single("photo"), uploadProfilePhoto);
router.post("/register", verifyFirebaseToken, registerProfile);
router.post("/login", verifyFirebaseToken, loginSync);
router.get("/me", verifyFirebaseToken, getCurrentUser);

module.exports = router;