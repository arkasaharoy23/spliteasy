import { watchAuthState, signOutUser } from "../services/auth-service.js";
import { fetchCurrentUser } from "../services/user-service.js";
import { ROUTES } from "../utils/constants.js";

const greetingName = document.getElementById("greetingName");
const userAvatar = document.getElementById("userAvatar");
const userFullName = document.getElementById("userFullName");
const userUsername = document.getElementById("userUsername");
const sidebarToggle = document.getElementById("sidebarToggle");
const logoutBtn = document.getElementById("logoutBtn");

const groupList = document.getElementById("groupList");
const groupEmptyState = document.getElementById("groupEmptyState");
const activityList = document.getElementById("activityList");
const activityEmptyState = document.getElementById("activityEmptyState");

const statGroups = document.getElementById("statGroups");
const statOwe = document.getElementById("statOwe");
const statOwed = document.getElementById("statOwed");
const statNet = document.getElementById("statNet");

function initialsFromName(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  const first = parts[0]?.[0] || "";
  const second = parts[1]?.[0] || "";
  return (first + second).toUpperCase() || "?";
}

function applyProfileToUI(profile) {
  const displayName = profile.fullName || profile.username || "there";
  greetingName.textContent = displayName.split(" ")[0];
  userFullName.textContent = displayName;
  userUsername.textContent = `@${profile.username}`;

  if (profile.profilePhotoUrl) {
    userAvatar.style.backgroundImage = `url(${profile.profilePhotoUrl})`;
    userAvatar.textContent = "";
  } else {
    userAvatar.textContent = initialsFromName(profile.fullName || profile.username);
  }
}

function renderGroupsAndActivity(groups, activity) {
  if (groups.length === 0) {
    groupEmptyState.classList.add("is-visible");
  } else {
    groups.forEach((group) => {
      const li = document.createElement("li");
      const balanceClass = group.balance >= 0 ? "balance-positive" : "balance-negative";
      const balanceLabel = group.balance >= 0 ? `+\u20b9${group.balance}` : `-\u20b9${Math.abs(group.balance)}`;

      li.innerHTML = `
        <div>
          <div class="group-item-name">${group.name}</div>
          <div class="group-item-meta">${group.memberCount} members</div>
        </div>
        <span class="group-item-balance ${balanceClass}">${balanceLabel}</span>
      `;
      groupList.appendChild(li);
    });
  }

  if (activity.length === 0) {
    activityEmptyState.classList.add("is-visible");
  } else {
    activity.forEach((item) => {
      const li = document.createElement("li");
      li.innerHTML = `
        <span class="activity-item-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 8v4l3 3" /><circle cx="12" cy="12" r="9" /></svg>
        </span>
        <span class="activity-item-text">${item.text}</span>
        <span class="activity-item-time">${item.time}</span>
      `;
      activityList.appendChild(li);
    });
  }

  const totalOwe = groups.filter((g) => g.balance < 0).reduce((sum, g) => sum + Math.abs(g.balance), 0);
  const totalOwed = groups.filter((g) => g.balance > 0).reduce((sum, g) => sum + g.balance, 0);

  statGroups.textContent = groups.length;
  statOwe.textContent = `\u20b9${totalOwe}`;
  statOwed.textContent = `\u20b9${totalOwed}`;

  const net = totalOwed - totalOwe;
  statNet.textContent = net >= 0 ? `+\u20b9${net}` : `-\u20b9${Math.abs(net)}`;
}

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

  try {
    const idToken = await firebaseUser.getIdToken();
    const { user: profile } = await fetchCurrentUser(idToken);
    applyProfileToUI(profile);
  } catch (error) {
    applyProfileToUI({
      fullName: firebaseUser.displayName,
      username: (firebaseUser.email || "").split("@")[0],
      profilePhotoUrl: firebaseUser.photoURL
    });
  }

  renderGroupsAndActivity([], []);
});