const cloudinary = require("../config/cloudinary");
const User = require("../models/User");
const { isValidUsername, isValidUpiId } = require("../utils/validators");

function streamUpload(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "spliteasy/profile-photos" },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    stream.end(buffer);
  });
}

async function uploadProfilePhoto(req, res) {
  if (!req.file) {
    return res.status(400).json({ message: "No image file provided" });
  }

  try {
    const result = await streamUpload(req.file.buffer);
    res.status(200).json({
      photoUrl: result.secure_url,
      photoPublicId: result.public_id
    });
  } catch (error) {
    res.status(500).json({ message: "Image upload failed", error: error.message });
  }
}

async function registerProfile(req, res) {
  const { uid, email } = req.firebaseUser;
  const {
    username,
    fullName,
    upiId,
    profilePhotoUrl,
    profilePhotoPublicId,
    authProvider
  } = req.body;

  if (!isValidUsername(username)) {
    return res.status(400).json({ message: "Username must be 3-20 characters (letters, numbers, underscore)" });
  }

  if (!isValidUpiId(upiId)) {
    return res.status(400).json({ message: "Enter a valid UPI ID, like name@bank" });
  }

  try {
    const usernameTaken = await User.findOne({ username, firebaseUid: { $ne: uid } });
    if (usernameTaken) {
      return res.status(409).json({ message: "Username is already taken" });
    }

    let user;

    try {
      user = await User.findOneAndUpdate(
        { firebaseUid: uid },
        {
          firebaseUid: uid,
          email,
          username,
          fullName,
          upiId,
          profilePhotoUrl,
          profilePhotoPublicId,
          authProvider: authProvider || "password",
          lastLoginAt: new Date()
        },
        { new: true, upsert: true, setDefaultsOnInsert: true, runValidators: true }
      );
    } catch (writeError) {
      if (writeError.code !== 11000) throw writeError;

      const conflictField = Object.keys(writeError.keyValue || writeError.keyPattern || {})[0];

      if (conflictField === "firebaseUid") {
        user = await User.findOneAndUpdate(
          { firebaseUid: uid },
          { lastLoginAt: new Date() },
          { new: true }
        );
      } else if (conflictField === "email") {
        const existingByEmail = await User.findOne({ email });
        if (!existingByEmail) throw writeError;

        existingByEmail.firebaseUid = uid;
        if (fullName) existingByEmail.fullName = fullName;
        if (upiId !== undefined) existingByEmail.upiId = upiId;
        if (profilePhotoUrl) existingByEmail.profilePhotoUrl = profilePhotoUrl;
        if (profilePhotoPublicId) existingByEmail.profilePhotoPublicId = profilePhotoPublicId;
        if (authProvider) existingByEmail.authProvider = authProvider;
        existingByEmail.lastLoginAt = new Date();

        user = await existingByEmail.save();
      } else {
        throw writeError;
      }
    }

    res.status(200).json({ user });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue || error.keyPattern || {})[0];
      console.error("registerProfile duplicate key error:", { field, keyValue: error.keyValue, keyPattern: error.keyPattern });
      const message =
        field === "email"
          ? "An account already exists for this email"
          : field === "username"
          ? "Username is already taken"
          : "Account already exists";
      return res.status(409).json({ message });
    }
    res.status(500).json({ message: "Could not save profile", error: error.message });
  }
}

async function updateProfile(req, res) {
  const { uid } = req.firebaseUser;
  const { username, fullName, upiId, profilePhotoUrl, profilePhotoPublicId } = req.body;

  if (username && !isValidUsername(username)) {
    return res.status(400).json({ message: "Username must be 3-20 characters (letters, numbers, underscore)" });
  }

  if (upiId && !isValidUpiId(upiId)) {
    return res.status(400).json({ message: "Enter a valid UPI ID, like name@bank" });
  }

  try {
    if (username) {
      const usernameTaken = await User.findOne({ username, firebaseUid: { $ne: uid } });
      if (usernameTaken) {
        return res.status(409).json({ message: "Username is already taken" });
      }
    }

    const updates = {};
    if (username) updates.username = username;
    if (fullName !== undefined) updates.fullName = fullName;
    if (upiId !== undefined) updates.upiId = upiId;
    if (profilePhotoUrl) updates.profilePhotoUrl = profilePhotoUrl;
    if (profilePhotoPublicId) updates.profilePhotoPublicId = profilePhotoPublicId;

    const user = await User.findOneAndUpdate({ firebaseUid: uid }, updates, { new: true });

    if (!user) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Username is already taken" });
    }
    res.status(500).json({ message: "Could not update profile", error: error.message });
  }
}

async function loginSync(req, res) {
  const { uid } = req.firebaseUser;

  try {
    const user = await User.findOneAndUpdate(
      { firebaseUid: uid },
      { lastLoginAt: new Date() },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "No profile found for this account" });
    }

    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: "Login sync failed", error: error.message });
  }
}

async function getCurrentUser(req, res) {
  const { uid } = req.firebaseUser;

  try {
    const user = await User.findOne({ firebaseUid: uid });
    if (!user) {
      return res.status(404).json({ message: "Profile not found" });
    }
    res.status(200).json({ user });
  } catch (error) {
    res.status(500).json({ message: "Could not fetch profile", error: error.message });
  }
}

module.exports = { uploadProfilePhoto, registerProfile, updateProfile, loginSync, getCurrentUser };