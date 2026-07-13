import { API_BASE_URL } from "../utils/constants.js";

async function request(path, options) {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

function authHeaders(idToken, extra = {}) {
  return { Authorization: `Bearer ${idToken}`, ...extra };
}

export function fetchNotifications(idToken) {
  return request("/notifications", {
    method: "GET",
    headers: authHeaders(idToken)
  });
}

export function markNotificationRead(idToken, notificationId) {
  return request(`/notifications/${notificationId}/read`, {
    method: "PATCH",
    headers: authHeaders(idToken)
  });
}

export function markAllNotificationsRead(idToken) {
  return request("/notifications/read-all", {
    method: "PATCH",
    headers: authHeaders(idToken)
  });
}