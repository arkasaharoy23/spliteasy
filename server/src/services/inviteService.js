const crypto = require("crypto");
const Invite = require("../models/Invite");

function generateCode() {
  return crypto.randomBytes(6).toString("base64url");
}

async function createInvite(groupId, createdByUserId) {
  await Invite.updateMany({ group: groupId, isActive: true }, { isActive: false });

  let code = generateCode();
  let exists = await Invite.findOne({ code });

  while (exists) {
    code = generateCode();
    exists = await Invite.findOne({ code });
  }

  const invite = await Invite.create({
    group: groupId,
    code,
    createdBy: createdByUserId,
    isActive: true
  });

  return invite;
}

async function getActiveInvite(groupId) {
  return Invite.findOne({ group: groupId, isActive: true }).sort({ createdAt: -1 });
}

module.exports = { createInvite, getActiveInvite };