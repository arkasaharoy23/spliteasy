import { timeAgo } from "../utils/formatters.js";

const ICONS = {
  member_joined: '<path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" />',
  expense_added: '<path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="9" />',
  payment_initiated: '<path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />',
  payment_confirmed: '<path d="M20 6L9 17l-5-5" />',
  added_to_group: '<path d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" />'
};

export function renderNotificationItem(notification, onMarkRead) {
  const li = document.createElement("li");
  li.className = `notification-item${notification.isRead ? "" : " is-unread"}`;

  const iconPath = ICONS[notification.type] || ICONS.expense_added;

  li.innerHTML = `
    <span class="notification-icon">
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconPath}</svg>
    </span>
    <span class="notification-text">
      <span class="notification-message">${notification.message}</span>
      <span class="notification-time">${timeAgo(notification.createdAt)}${notification.group ? ` \u00b7 ${notification.group.name}` : ""}</span>
    </span>
    ${notification.isRead ? "" : `<button type="button" class="btn btn-secondary btn-sm notification-mark-read">Mark read</button>`}
  `;

  if (!notification.isRead) {
    li.querySelector(".notification-mark-read").addEventListener("click", () => onMarkRead(notification._id));
  }

  return li;
}