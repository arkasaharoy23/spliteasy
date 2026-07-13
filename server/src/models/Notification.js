const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: ["added_to_group", "member_joined", "expense_added", "payment_initiated", "payment_confirmed"],
      required: true
    },
    message: { type: String, required: true },
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group" },
    isRead: { type: Boolean, default: false }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Notification", notificationSchema);