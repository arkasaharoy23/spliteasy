import { MAX_PHOTO_SIZE_MB, ALLOWED_PHOTO_TYPES } from "./constants.js";

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidPassword(password) {
  return typeof password === "string" && password.length >= 6;
}

export function isValidUsername(username) {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username);
}

export function isValidUpiId(upiId) {
  if (!upiId) return true;
  return /^[\w.-]{2,256}@[a-zA-Z]{2,64}$/.test(upiId);
}

export function passwordsMatch(password, confirmPassword) {
  return password === confirmPassword;
}

export function isValidPhotoFile(file) {
  if (!file) return { valid: true };

  if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
    return { valid: false, message: "Only JPG, PNG or WEBP images are allowed" };
  }

  if (file.size > MAX_PHOTO_SIZE_MB * 1024 * 1024) {
    return { valid: false, message: `Image must be under ${MAX_PHOTO_SIZE_MB}MB` };
  }

  return { valid: true };
}