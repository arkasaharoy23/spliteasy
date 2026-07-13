import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  updateFirebaseProfile,
  mapFirebaseError
} from "../services/auth-service.js";
import { uploadProfilePhoto, registerProfile, syncLogin } from "../services/user-service.js";
import {
  isValidEmail,
  isValidPassword,
  isValidUsername,
  isValidUpiId,
  passwordsMatch,
  isValidPhotoFile
} from "../utils/validators.js";
import { ROUTES } from "../utils/constants.js";

function redirectAfterAuth() {
  const pendingJoinCode = sessionStorage.getItem("pendingJoinCode");
  if (pendingJoinCode) {
    window.location.href = `groups.html?join=${pendingJoinCode}`;
    return;
  }
  window.location.href = ROUTES.DASHBOARD;
}

function showBanner(banner, message, type) {
  banner.textContent = message;
  banner.classList.remove("form-banner-error", "form-banner-success");
  banner.classList.add(type === "success" ? "form-banner-success" : "form-banner-error", "is-visible");
}

function hideBanner(banner) {
  banner.classList.remove("is-visible");
}

function showFieldError(fieldWrapper, message) {
  const input = fieldWrapper.querySelector("input");
  const errorEl = fieldWrapper.querySelector(".form-error");
  input.classList.add("is-invalid");
  errorEl.textContent = message;
  errorEl.classList.add("is-visible");
}

function clearFieldError(fieldWrapper) {
  const input = fieldWrapper.querySelector("input");
  const errorEl = fieldWrapper.querySelector(".form-error");
  input.classList.remove("is-invalid");
  errorEl.classList.remove("is-visible");
}

function setButtonLoading(button, isLoading) {
  button.classList.toggle("btn-loading", isLoading);
  button.disabled = isLoading;
}

function setupPasswordToggle(root) {
  root.querySelectorAll(".password-toggle").forEach((toggle) => {
    toggle.addEventListener("click", () => {
      const input = toggle.parentElement.querySelector("input");
      const isPassword = input.type === "password";
      input.type = isPassword ? "text" : "password";
      toggle.textContent = isPassword ? "Hide" : "Show";
    });
  });
}

function setupPhotoPreview(fileInput, previewEl, errorEl) {
  fileInput.addEventListener("change", () => {
    const file = fileInput.files[0];
    errorEl.classList.remove("is-visible");

    if (!file) return;

    const validation = isValidPhotoFile(file);
    if (!validation.valid) {
      errorEl.textContent = validation.message;
      errorEl.classList.add("is-visible");
      fileInput.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      previewEl.style.backgroundImage = `url(${reader.result})`;
      previewEl.textContent = "";
    };
    reader.readAsDataURL(file);
  });
}

function initSignupForm() {
  const form = document.getElementById("signupForm");
  if (!form) return;

  const banner = document.getElementById("signupBanner");
  const submitBtn = document.getElementById("signupSubmit");
  const googleBtn = document.getElementById("googleSignup");
  const fileInput = document.getElementById("profilePhotoInput");
  const preview = document.getElementById("photoPreview");
  const photoError = document.getElementById("photoError");

  setupPasswordToggle(form);
  setupPhotoPreview(fileInput, preview, photoError);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    hideBanner(banner);

    const fullNameField = document.getElementById("fullNameField");
    const usernameField = document.getElementById("usernameField");
    const emailField = document.getElementById("emailField");
    const passwordField = document.getElementById("passwordField");
    const confirmPasswordField = document.getElementById("confirmPasswordField");
    const upiField = document.getElementById("upiField");

    [fullNameField, usernameField, emailField, passwordField, confirmPasswordField, upiField].forEach(clearFieldError);

    const fullName = fullNameField.querySelector("input").value.trim();
    const username = usernameField.querySelector("input").value.trim();
    const email = emailField.querySelector("input").value.trim();
    const password = passwordField.querySelector("input").value;
    const confirmPassword = confirmPasswordField.querySelector("input").value;
    const upiId = upiField.querySelector("input").value.trim();

    let hasError = false;

    if (fullName.length < 2) {
      showFieldError(fullNameField, "Enter your full name");
      hasError = true;
    }

    if (!isValidUsername(username)) {
      showFieldError(usernameField, "3-20 characters, letters, numbers or underscore only");
      hasError = true;
    }

    if (!isValidEmail(email)) {
      showFieldError(emailField, "Enter a valid email address");
      hasError = true;
    }

    if (!isValidPassword(password)) {
      showFieldError(passwordField, "Password must be at least 6 characters");
      hasError = true;
    }

    if (!passwordsMatch(password, confirmPassword)) {
      showFieldError(confirmPasswordField, "Passwords do not match");
      hasError = true;
    }

    if (!isValidUpiId(upiId)) {
      showFieldError(upiField, "Enter a valid UPI ID, like name@bank");
      hasError = true;
    }

    if (hasError) return;

    setButtonLoading(submitBtn, true);

    try {
      const credential = await signUpWithEmail(email, password);
      const firebaseUser = credential.user;

      await updateFirebaseProfile(firebaseUser, { displayName: fullName });

      const idToken = await firebaseUser.getIdToken();

      let profilePhotoUrl = "";
      let profilePhotoPublicId = "";

      const photoFile = fileInput.files[0];
      if (photoFile) {
        const uploadResult = await uploadProfilePhoto(photoFile, idToken);
        profilePhotoUrl = uploadResult.photoUrl;
        profilePhotoPublicId = uploadResult.photoPublicId;
      }

      await registerProfile(idToken, {
        fullName,
        username,
        upiId,
        profilePhotoUrl,
        profilePhotoPublicId,
        authProvider: "password"
      });

      showBanner(banner, "Account created. Redirecting to your dashboard...", "success");
      redirectAfterAuth();
    } catch (error) {
      const message = error.code ? mapFirebaseError(error) : error.message;
      showBanner(banner, message, "error");
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });

  googleBtn.addEventListener("click", async () => {
    hideBanner(banner);
    setButtonLoading(googleBtn, true);

    try {
      const credential = await signInWithGoogle();
      const firebaseUser = credential.user;
      const idToken = await firebaseUser.getIdToken();

      await registerProfile(idToken, {
        fullName: firebaseUser.displayName || "",
        username: (firebaseUser.email || "").split("@")[0],
        upiId: "",
        profilePhotoUrl: firebaseUser.photoURL || "",
        profilePhotoPublicId: "",
        authProvider: "google"
      });

      redirectAfterAuth();
    } catch (error) {
      const message = error.code ? mapFirebaseError(error) : error.message;
      showBanner(banner, message, "error");
    } finally {
      setButtonLoading(googleBtn, false);
    }
  });
}

function initLoginForm() {
  const form = document.getElementById("loginForm");
  if (!form) return;

  const banner = document.getElementById("loginBanner");
  const submitBtn = document.getElementById("loginSubmit");
  const googleBtn = document.getElementById("googleLogin");

  setupPasswordToggle(form);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    hideBanner(banner);

    const emailField = document.getElementById("loginEmailField");
    const passwordField = document.getElementById("loginPasswordField");

    [emailField, passwordField].forEach(clearFieldError);

    const email = emailField.querySelector("input").value.trim();
    const password = passwordField.querySelector("input").value;

    let hasError = false;

    if (!isValidEmail(email)) {
      showFieldError(emailField, "Enter a valid email address");
      hasError = true;
    }

    if (!password) {
      showFieldError(passwordField, "Enter your password");
      hasError = true;
    }

    if (hasError) return;

    setButtonLoading(submitBtn, true);

    try {
      const credential = await signInWithEmail(email, password);
      const idToken = await credential.user.getIdToken();
      await syncLogin(idToken);
      redirectAfterAuth();
    } catch (error) {
      const message = error.code ? mapFirebaseError(error) : error.message;
      showBanner(banner, message, "error");
    } finally {
      setButtonLoading(submitBtn, false);
    }
  });

  googleBtn.addEventListener("click", async () => {
    hideBanner(banner);
    setButtonLoading(googleBtn, true);

    try {
      const credential = await signInWithGoogle();
      const firebaseUser = credential.user;
      const idToken = await firebaseUser.getIdToken();

      await registerProfile(idToken, {
        fullName: firebaseUser.displayName || "",
        username: (firebaseUser.email || "").split("@")[0],
        upiId: "",
        profilePhotoUrl: firebaseUser.photoURL || "",
        profilePhotoPublicId: "",
        authProvider: "google"
      });

      redirectAfterAuth();
    } catch (error) {
      const message = error.code ? mapFirebaseError(error) : error.message;
      showBanner(banner, message, "error");
    } finally {
      setButtonLoading(googleBtn, false);
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initSignupForm();
  initLoginForm();
});