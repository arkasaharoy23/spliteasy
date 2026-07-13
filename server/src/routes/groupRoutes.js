const express = require("express");
const verifyFirebaseToken = require("../middleware/auth");
const { validateCreateGroup } = require("../middleware/validation");
const {
  createGroup,
  getMyGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  regenerateInvite,
  joinGroupByInviteCode
} = require("../controllers/groupController");

const router = express.Router();

router.post("/", verifyFirebaseToken, validateCreateGroup, createGroup);
router.get("/", verifyFirebaseToken, getMyGroups);
router.get("/:id", verifyFirebaseToken, getGroupById);
router.patch("/:id", verifyFirebaseToken, updateGroup);
router.delete("/:id", verifyFirebaseToken, deleteGroup);
router.post("/:id/invite/regenerate", verifyFirebaseToken, regenerateInvite);
router.post("/join/:code", verifyFirebaseToken, joinGroupByInviteCode);

module.exports = router;