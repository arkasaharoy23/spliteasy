const Notification = require("../models/Notification");
const User = require("../models/User");

async function getCurrentAppUser(req) {
  return User.findOne({ firebaseUid: req.firebaseUser.uid });
}

async function getMyNotifications(req, res) {
  try {
    const currentUser = await getCurrentAppUser(req);
    if (!currentUser) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const notifications = await Notification.find({ user: currentUser._id })
      .populate("group", "name")
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({ user: currentUser._id, isRead: false });

    res.status(200).json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ message: "Could not fetch notifications", error: error.message });
  }
}

async function markAsRead(req, res) {
  try {
    const currentUser = await getCurrentAppUser(req);
    const notification = await Notification.findOne({ _id: req.params.id, user: currentUser._id });

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({ notification });
  } catch (error) {
    res.status(500).json({ message: "Could not update notification", error: error.message });
  }
}

async function markAllAsRead(req, res) {
  try {
    const currentUser = await getCurrentAppUser(req);
    await Notification.updateMany({ user: currentUser._id, isRead: false }, { isRead: true });
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (error) {
    res.status(500).json({ message: "Could not update notifications", error: error.message });
  }
}

module.exports = { getMyNotifications, markAsRead, markAllAsRead };