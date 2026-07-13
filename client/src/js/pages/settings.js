import { watchAuthState, signOutUser } from "../services/auth-service.js";
import { fetchCurrentUser, uploadProfilePhoto, updateProfile } from "../services/user-service.js";
import { isValidUsername, isValidUpiId, isValidPhotoFile } from "../utils/validators.js";
import { initialsFromName } from "../utils/formatters.js";
import { ROUTES } from "../utils/constants.js";

const sidebarToggle = document.getElementById("sidebarToggle");
const logoutBtn = document.getElementById("logoutBtn");
const photoPreview = document.getElementById("settingsPhotoPreview");
const photoInput = document.getElementById("settingsPhotoInput");
const photoError = document.getElementById("settingsPhotoError");
const fullNameField = document.getElementById("settingsFullNameField");
const usernameField = document.getElementById("settingsUsernameField");
const upiField = document.getElementById("settingsUpiField");
const emailInput = document.getElementById("settingsEmail");
const banner = document.getElementById("settingsBanner");
const form = document.getElementById("settingsForm");
const submitBtn = document.getElementById("settingsSubmit");

let currentIdToken = null;
let pendingPhotoFile = null;

function clearFieldError(fieldWrapper) {
  fieldWrapper.querySelector("input").classList.remove("is-invalid");
  fieldWrapper.querySelector(".form-error").classList.remove("is-visible");
}

function showFieldError(fieldWrapper, message) {
  fieldWrapper.querySelector("input").classList.add("is-invalid");
  const errorEl = fieldWrapper.querySelector(".form-error");
  errorEl.textContent = message;
  errorEl.classList.add("is-visible");
}

function showBanner(message, type) {
  banner.textContent = message;
  banner.classList.remove("form-banner-error", "form-banner-success");
  banner.classList.add(type === "success" ? "form-banner-success" : "form-banner-error", "is-visible");
}

photoInput.addEventListener("change", () => {
  const file = photoInput.files[0];
  photoError.classList.remove("is-visible");
  if (!file) return;

  const validation = isValidPhotoFile(file);
  if (!validation.valid) {
    photoError.textContent = validation.message;
    photoError.classList.add("is-visible");
    photoInput.value = "";
    return;
  }

  pendingPhotoFile = file;
  const reader = new FileReader();
  reader.onload = () => {
    photoPreview.style.backgroundImage = `url(${reader.result})`;
    photoPreview.textContent = "";
  };
  reader.readAsDataURL(file);
});

async function loadProfile() {
  const { user } = await fetchCurrentUser(currentIdToken);

  document.getElementById("settingsFullName").value = user.fullName || "";
  document.getElementById("settingsUsername").value = user.username || "";
  document.getElementById("settingsUpi").value = user.upiId || "";
  emailInput.value = user.email || "";

  if (user.profilePhotoUrl) {
    photoPreview.style.backgroundImage = `url(${user.profilePhotoUrl})`;
    photoPreview.textContent = "";
  } else {
    photoPreview.textContent = initialsFromName(user.fullName || user.username);
  }
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  banner.classList.remove("is-visible");
  [fullNameField, usernameField, upiField].forEach(clearFieldError);

  const fullName = document.getElementById("settingsFullName").value.trim();
  const username = document.getElementById("settingsUsername").value.trim();
  const upiId = document.getElementById("settingsUpi").value.trim();

  let hasError = false;

  if (!isValidUsername(username)) {
    showFieldError(usernameField, "3-20 characters, letters, numbers or underscore only");
    hasError = true;
  }

  if (!isValidUpiId(upiId)) {
    showFieldError(upiField, "Enter a valid UPI ID, like name@bank");
    hasError = true;
  }

  if (hasError) return;

  submitBtn.classList.add("btn-loading");
  submitBtn.disabled = true;

  try {
    let profilePhotoUrl;
    let profilePhotoPublicId;

    if (pendingPhotoFile) {
      const uploadResult = await uploadProfilePhoto(pendingPhotoFile, currentIdToken);
      profilePhotoUrl = uploadResult.photoUrl;
      profilePhotoPublicId = uploadResult.photoPublicId;
    }

    await updateProfile(currentIdToken, {
      fullName,
      username,
      upiId,
      ...(profilePhotoUrl ? { profilePhotoUrl, profilePhotoPublicId } : {})
    });

    pendingPhotoFile = null;
    showBanner("Profile updated", "success");
  } catch (error) {
    showBanner(error.message, "error");
  } finally {
    submitBtn.classList.remove("btn-loading");
    submitBtn.disabled = false;
  }
});

sidebarToggle.addEventListener("click", () => {
  document.body.classList.toggle("sidebar-open");
});

logoutBtn.addEventListener("click", async () => {
  await signOutUser();
  window.location.href = ROUTES.LOGIN;
});

watchAuthState(async (firebaseUser) => {
  if (!firebaseUser) {
    window.location.href = ROUTES.LOGIN;
    return;
  }

  currentIdToken = await firebaseUser.getIdToken();

  try {
    await loadProfile();
  } catch (error) {
    console.error("Could not load profile:", error);
    showBanner("Couldn't load your profile. Check that the backend server is running.", "error");
  }
});