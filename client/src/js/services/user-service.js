import { API_BASE_URL } from "../utils/constants.js";

async function request(path, options) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export function uploadProfilePhoto(file, idToken) {
  const formData = new FormData();
  formData.append("photo", file);

  return request("/auth/upload-photo", {
    method: "POST",
    headers: { Authorization: `Bearer ${idToken}` },
    body: formData
  });
}

export function registerProfile(idToken, profileData) {
  return request("/auth/register", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`
    },
    body: JSON.stringify(profileData)
  });
}

export function syncLogin(idToken) {
  return request("/auth/login", {
    method: "POST",
    headers: { Authorization: `Bearer ${idToken}` }
  });
}

export function fetchCurrentUser(idToken) {
  return request("/auth/me", {
    method: "GET",
    headers: { Authorization: `Bearer ${idToken}` }
  });
}