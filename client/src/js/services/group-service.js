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

export function createGroup(idToken, { name, description }) {
  return request("/groups", {
    method: "POST",
    headers: authHeaders(idToken, { "Content-Type": "application/json" }),
    body: JSON.stringify({ name, description })
  });
}

export function fetchMyGroups(idToken) {
  return request("/groups", {
    method: "GET",
    headers: authHeaders(idToken)
  });
}

export function fetchGroupById(idToken, groupId) {
  return request(`/groups/${groupId}`, {
    method: "GET",
    headers: authHeaders(idToken)
  });
}

export function updateGroup(idToken, groupId, payload) {
  return request(`/groups/${groupId}`, {
    method: "PATCH",
    headers: authHeaders(idToken, { "Content-Type": "application/json" }),
    body: JSON.stringify(payload)
  });
}

export function deleteGroup(idToken, groupId) {
  return request(`/groups/${groupId}`, {
    method: "DELETE",
    headers: authHeaders(idToken)
  });
}

export function regenerateInvite(idToken, groupId) {
  return request(`/groups/${groupId}/invite/regenerate`, {
    method: "POST",
    headers: authHeaders(idToken)
  });
}

export function joinGroupByInviteCode(idToken, code) {
  return request(`/groups/join/${code}`, {
    method: "POST",
    headers: authHeaders(idToken)
  });
}