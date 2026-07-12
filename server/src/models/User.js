const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    firebaseUid: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      minlength: 3,
      maxlength: 20
    },
    fullName: {
      type: String,
      trim: true,
      default: ""
    },
    profilePhotoUrl: {
      type: String,
      default: ""
    },
    profilePhotoPublicId: {
      type: String,
      default: ""
    },
    upiId: {
      type: String,
      trim: true,
      default: ""
    },
    authProvider: {
      type: String,
      enum: ["password", "google"],
      default: "password"
    },
    lastLoginAt: {
      type: Date
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);