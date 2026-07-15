import { watchAuthState, signOutUser } from "../services/auth-service.js";
import { createGroup, fetchMyGroups, regenerateInvite, fetchInvitePreview, joinGroupByInviteCode } from "../services/group-service.js";
import { renderGroupCard } from "../components/group-card.js";
import { renderQrCode } from "../utils/qr-generator.js";
import { ROUTES } from "../utils/constants.js";

const sidebarToggle = document.getElementById("sidebarToggle");
const logoutBtn = document.getElementById("logoutBtn");
const showCreateGroupBtn = document.getElementById("showCreateGroupBtn");
const cancelCreateGroupBtn = document.getElementById("cancelCreateGroupBtn");
const createGroupPanel = document.getElementById("createGroupPanel");
const createGroupForm = document.getElementById("createGroupForm");
const createGroupBanner = document.getElementById("createGroupBanner");
const groupGrid = document.getElementById("groupGrid");
const groupsEmptyState = document.getElementById("groupsEmptyState");
const modalRoot = document.getElementById("modalRoot");

let currentIdToken = null;

async function loadModal(path) {
  const response = await fetch(path);
  const html = await response.text();
  modalRoot.innerHTML = html;
}

function openModal(overlayId) {
  document.getElementById(overlayId).classList.add("is-open");
}

function closeModal(overlayId) {
  const overlay = document.getElementById(overlayId);
  if (overlay) overlay.classList.remove("is-open");
}

modalRoot.addEventListener("click", (event) => {
  if (event.target.dataset.closeModal) {
    closeModal(event.target.dataset.closeModal);
  }
  if (event.target.classList.contains("modal-overlay")) {
    event.target.classList.remove("is-open");
  }
});

async function showInviteModal(groupId, inviteCode) {
  await loadModal("../views/modals/invite-modal.html");

  const inviteLinkInput = document.getElementById("inviteLinkInput");
  const inviteQrContainer = document.getElementById("inviteQrContainer");
  const copyBtn = document.getElementById("copyInviteLinkBtn");
  const regenerateBtn = document.getElementById("regenerateInviteBtn");

  function renderInvite(code) {
    const link = `${window.location.origin}${window.location.pathname}?join=${code}`;
    inviteLinkInput.value = link;
    renderQrCode(inviteQrContainer, link);
  }

  renderInvite(inviteCode);

  copyBtn.addEventListener("click", async () => {
    await navigator.clipboard.writeText(inviteLinkInput.value);
    copyBtn.textContent = "Copied";
    setTimeout(() => (copyBtn.textContent = "Copy"), 1500);
  });

  regenerateBtn.addEventListener("click", async () => {
    const result = await regenerateInvite(currentIdToken, groupId);
    renderInvite(result.inviteCode);
  });

  openModal("inviteModalOverlay");
}

async function loadGroups() {
  const { groups } = await fetchMyGroups(currentIdToken);
  groupGrid.innerHTML = "";

  if (groups.length === 0) {
    groupsEmptyState.classList.add("is-visible");
    return;
  }

  groupsEmptyState.classList.remove("is-visible");
  groups.forEach((group) => {
    groupGrid.appendChild(renderGroupCard(group));
  });
}

showCreateGroupBtn.addEventListener("click", () => {
  createGroupPanel.classList.add("is-open");
});

cancelCreateGroupBtn.addEventListener("click", () => {
  createGroupPanel.classList.remove("is-open");
  createGroupForm.reset();
});

createGroupForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  createGroupBanner.classList.remove("is-visible");

  const name = document.getElementById("newGroupName").value.trim();
  const description = document.getElementById("newGroupDescription").value.trim();

  if (name.length < 2) {
    createGroupBanner.textContent = "Group name must be at least 2 characters";
    createGroupBanner.classList.add("is-visible", "form-banner-error");
    return;
  }

  try {
    const { group, inviteCode } = await createGroup(currentIdToken, { name, description });
    createGroupForm.reset();
    createGroupPanel.classList.remove("is-open");
    await loadGroups();
    await showInviteModal(group._id, inviteCode);
  } catch (error) {
    createGroupBanner.textContent = error.message;
    createGroupBanner.classList.add("is-visible", "form-banner-error");
  }
});

sidebarToggle.addEventListener("click", () => {
  document.body.classList.toggle("sidebar-open");
});

logoutBtn.addEventListener("click", async () => {
  await signOutUser();
  window.location.href = ROUTES.LOGIN;
});

async function resolvePendingJoin() {
  const params = new URLSearchParams(window.location.search);
  const joinCode = params.get("join");
  if (!joinCode) return;

  try {
    const preview = await fetchInvitePreview(currentIdToken, joinCode);
    await showJoinConfirmModal(joinCode, preview);
  } catch (error) {
    createGroupBanner.textContent = error.message;
    createGroupBanner.classList.add("is-visible", "form-banner-error");
    window.history.replaceState({}, "", "groups.html");
  }
}

async function showJoinConfirmModal(joinCode, preview) {
  await loadModal("../views/modals/confirm-delete-modal.html");

  document.getElementById("confirmDeleteTitle").textContent = "Join group?";
  document.getElementById("confirmDeleteMessage").textContent =
    `Join "${preview.groupName}" as a new member? It has ${preview.memberCount} member${preview.memberCount === 1 ? "" : "s"}.`;

  const confirmBtn = document.getElementById("confirmDeleteConfirmBtn");
  confirmBtn.textContent = "Join group";
  confirmBtn.classList.remove("btn-danger");
  confirmBtn.classList.add("btn-primary");

  confirmBtn.addEventListener("click", async () => {
    confirmBtn.classList.add("btn-loading");
    confirmBtn.disabled = true;

    try {
      const { group } = await joinGroupByInviteCode(currentIdToken, joinCode);
      window.location.href = `group-details.html?groupId=${group._id}`;
    } catch (error) {
      closeModal("confirmDeleteModalOverlay");
      createGroupBanner.textContent = error.message;
      createGroupBanner.classList.add("is-visible", "form-banner-error");
      window.history.replaceState({}, "", "groups.html");
    }
  });

  document.querySelectorAll("[data-close-modal='confirmDeleteModalOverlay']").forEach((btn) => {
    btn.addEventListener("click", () => {
      window.history.replaceState({}, "", "groups.html");
    });
  });

  openModal("confirmDeleteModalOverlay");
}

watchAuthState(async (firebaseUser) => {
  if (!firebaseUser) {
    const params = new URLSearchParams(window.location.search);
    const joinCode = params.get("join");
    if (joinCode) {
      sessionStorage.setItem("pendingJoinCode", joinCode);
    }
    window.location.href = ROUTES.LOGIN;
    return;
  }

  currentIdToken = await firebaseUser.getIdToken();

  const storedJoinCode = sessionStorage.getItem("pendingJoinCode");
  if (storedJoinCode) {
    sessionStorage.removeItem("pendingJoinCode");
    window.history.replaceState({}, "", `groups.html?join=${storedJoinCode}`);
  }

  await resolvePendingJoin();
  await loadGroups();
});