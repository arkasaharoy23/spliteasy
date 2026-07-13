const Notification = require("../models/Notification");

async function notify(userId, type, message, groupId) {
  try {
    await Notification.create({ user: userId, type, message, group: groupId });
  } catch (error) {
    console.error("Could not create notification:", error.message);
  }
}

async function notifyMany(userIds, type, message, groupId) {
  await Promise.all(userIds.map((userId) => notify(userId, type, message, groupId)));
}

module.exports = { notify, notifyMany };