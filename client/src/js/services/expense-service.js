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

export function createExpense(idToken, groupId, formData) {
  return request(`/groups/${groupId}/expenses`, {
    method: "POST",
    headers: authHeaders(idToken),
    body: formData
  });
}

export function fetchGroupExpenses(idToken, groupId) {
  return request(`/groups/${groupId}/expenses`, {
    method: "GET",
    headers: authHeaders(idToken)
  });
}

export function createPayment(idToken, groupId, payload) {
  return request(`/groups/${groupId}/payments`, {
    method: "POST",
    headers: authHeaders(idToken, { "Content-Type": "application/json" }),
    body: JSON.stringify(payload)
  });
}

export function confirmPayment(idToken, groupId, paymentId) {
  return request(`/groups/${groupId}/payments/${paymentId}/confirm`, {
    method: "PATCH",
    headers: authHeaders(idToken)
  });
}