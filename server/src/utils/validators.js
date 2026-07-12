function isValidUsername(username) {
  return /^[a-zA-Z0-9_]{3,20}$/.test(username || "");
}

function isValidUpiId(upiId) {
  if (!upiId) return true;
  return /^[\w.-]{2,256}@[a-zA-Z]{2,64}$/.test(upiId);
}

module.exports = { isValidUsername, isValidUpiId };