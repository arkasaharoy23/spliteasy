import { auth, googleProvider } from "../config/firebase-config.js";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";

export function signUpWithEmail(email, password) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export function signInWithEmail(email, password) {
  return signInWithEmailAndPassword(auth, email, password);
}

export function signInWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

export function updateFirebaseProfile(user, profileData) {
  return updateProfile(user, profileData);
}

export function signOutUser() {
  return signOut(auth);
}

export function watchAuthState(callback) {
  return onAuthStateChanged(auth, callback);
}

export function mapFirebaseError(error) {
  const messages = {
    "auth/email-already-in-use": "An account with this email already exists.",
    "auth/invalid-email": "Enter a valid email address.",
    "auth/weak-password": "Password should be at least 6 characters.",
    "auth/user-not-found": "No account found with this email.",
    "auth/wrong-password": "Incorrect password. Try again.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/popup-closed-by-user": "Google sign-in was closed before finishing.",
    "auth/too-many-requests": "Too many attempts. Try again in a while.",
    "auth/network-request-failed": "Network error. Check your connection."
  };

  return messages[error.code] || "Something went wrong. Please try again.";
}