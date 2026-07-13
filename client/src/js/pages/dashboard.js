import { watchAuthState, signOutUser } from "../services/auth-service.js";
import { fetchCurrentUser } from "../services/user-service.js";
import { fetchMyGroups } from "../services/group-service.js";
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

  const idToken = await firebaseUser.getIdToken();

  try {
    const { user: profile } = await fetchCurrentUser(idToken);
    applyProfileToUI(profile);
  } catch (error) {
    console.error("Could not load profile from backend:", error);
    applyProfileToUI({
      fullName: firebaseUser.displayName,
      username: (firebaseUser.email || "").split("@")[0],
      profilePhotoUrl: firebaseUser.photoURL
    });
  }

  try {
    const { groups } = await fetchMyGroups(idToken);

    const activityItems = [];
    let totalOweINR = 0;
    let totalOwedINR = 0;

    groups.forEach((group) => {
      group.youOwe.forEach((entry) => {
        if (entry.currency === "INR") totalOweINR += entry.amount;
      });
      group.owedToYou.forEach((entry) => {
        if (entry.currency === "INR") totalOwedINR += entry.amount;
      });
    });

    const mappedGroups = groups.map((group) => {
      const totalOwe = group.youOwe.reduce((sum, b) => sum + (b.currency === "INR" ? b.amount : 0), 0);
      const totalOwed = group.owedToYou.reduce((sum, b) => sum + (b.currency === "INR" ? b.amount : 0), 0);
      return {
        name: group.name,
        memberCount: group.memberCount,
        balance: totalOwed - totalOwe
      };
    });

    renderGroupsAndActivity(mappedGroups, activityItems);

    statGroups.textContent = groups.length;
    statOwe.textContent = `\u20b9${totalOweINR}`;
    statOwed.textContent = `\u20b9${totalOwedINR}`;
    const net = totalOwedINR - totalOweINR;
    statNet.textContent = net >= 0 ? `+\u20b9${net}` : `-\u20b9${Math.abs(net)}`;
  } catch (error) {
    console.error("Could not load groups from backend:", error);
    renderGroupsAndActivity([], []);
    groupEmptyState.textContent = "Couldn't load your groups. Check that the backend server is running.";
    activityEmptyState.textContent = "Couldn't load recent activity.";
    statGroups.textContent = "\u2014";
    statOwe.textContent = "\u2014";
    statOwed.textContent = "\u2014";
    statNet.textContent = "\u2014";
  }
});