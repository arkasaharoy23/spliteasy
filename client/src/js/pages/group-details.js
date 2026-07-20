import { watchAuthState, signOutUser } from "../services/auth-service.js";
import {
  fetchGroupById,
  updateGroup,
  deleteGroup,
  regenerateInvite
} from "../services/group-service.js";
import {
  createExpense,
  createPayment,
  confirmPayment
} from "../services/expense-service.js";
import { renderExpenseCard } from "../components/expense-card.js";
import { renderQrCode } from "../utils/qr-generator.js";
import { formatCurrency } from "../utils/formatters.js";
import { ROUTES } from "../utils/constants.js";
import { isValidPhotoFile } from "../utils/validators.js";

const params = new URLSearchParams(window.location.search);
const groupId = params.get("groupId");

const sidebarToggle = document.getElementById("sidebarToggle");
const logoutBtn = document.getElementById("logoutBtn");
const groupNameHeading = document.getElementById("groupNameHeading");
const groupDescriptionEl = document.getElementById("groupDescription");
const memberCountEl = document.getElementById("memberCount");
const membersList = document.getElementById("membersList");
const expensesList = document.getElementById("expensesList");
const expensesEmptyState = document.getElementById("expensesEmptyState");
const youOweList = document.getElementById("youOweList");
const youOweEmptyState = document.getElementById("youOweEmptyState");
const owedToYouList = document.getElementById("owedToYouList");
const owedToYouEmptyState = document.getElementById("owedToYouEmptyState");
const inviteBtn = document.getElementById("inviteBtn");
const groupMenuBtn = document.getElementById("groupMenuBtn");
const groupMenuDropdown = document.getElementById("groupMenuDropdown");
const editGroupOpenBtn = document.getElementById("editGroupOpenBtn");
const deleteGroupOpenBtn = document.getElementById("deleteGroupOpenBtn");
const addExpenseOpenBtn = document.getElementById("addExpenseOpenBtn");
const modalRoot = document.getElementById("modalRoot");

let currentIdToken = null;
let currentUserId = null;
let currentGroupData = null;
let pendingRemovals = new Set();

if (!groupId) {
  window.location.href = ROUTES.DASHBOARD;
}

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

document.addEventListener("click", (event) => {
  if (!groupMenuBtn.contains(event.target) && !groupMenuDropdown.contains(event.target)) {
    groupMenuDropdown.classList.remove("is-open");
  }
});

groupMenuBtn.addEventListener("click", () => {
  groupMenuDropdown.classList.toggle("is-open");
});

function memberName(user) {
  return user.fullName || user.username;
}

function findPendingPayment(payments, fromId, toId, currency) {
  return payments.find(
    (p) =>
      p.status === "pending" &&
      (p.from._id || p.from) === fromId &&
      (p.to._id || p.to) === toId &&
      p.currency === currency
  );
}

function renderMembers(group) {
  membersList.innerHTML = "";
  memberCountEl.textContent = `${group.members.length} members`;

  group.members.forEach((member) => {
    const li = document.createElement("li");
    li.className = "member-row";
    li.innerHTML = `
      <span class="member-row-name">${memberName(member.user)}</span>
      <span class="member-role-badge">${member.role}</span>
    `;
    membersList.appendChild(li);
  });
}

function renderExpenses(expenses) {
  expensesList.innerHTML = "";

  if (expenses.length === 0) {
    expensesEmptyState.classList.add("is-visible");
    return;
  }

  expensesEmptyState.classList.remove("is-visible");
  expenses.forEach((expense) => {
    expensesList.appendChild(renderExpenseCard(expense, currentUserId));
  });
}

function renderSettleUp(data) {
  youOweList.innerHTML = "";
  owedToYouList.innerHTML = "";

  if (data.youOwe.length === 0) {
    youOweEmptyState.classList.add("is-visible");
  } else {
    youOweEmptyState.classList.remove("is-visible");

    data.youOwe.forEach((entry) => {
      const member = data.group.members.find((m) => (m.user._id || m.user) === entry.owedTo);
      const receiver = member ? member.user : null;
      const pending = findPendingPayment(data.group.payments, currentUserId, entry.owedTo, entry.currency);

      const li = document.createElement("li");
      li.className = "settle-item";

      if (pending) {
        li.innerHTML = `
          <span class="settle-item-name">You owe ${receiver ? memberName(receiver) : ""}</span>
          <span class="settle-item-amount">${formatCurrency(entry.amount, entry.currency)}</span>
          <span class="settle-item-status">Marked as ${pending.method}, waiting for confirmation</span>
        `;
      } else {
        const isInr = entry.currency === "INR";
        const hasUpiId = receiver && receiver.upiId;

        let upiButtonHtml = "";
        if (isInr && hasUpiId) {
          upiButtonHtml = `<button type="button" class="btn btn-primary btn-sm" data-pay-upi='${JSON.stringify({ to: entry.owedTo, amount: entry.amount, currency: entry.currency, upiId: receiver.upiId, name: memberName(receiver) })}'>Pay via UPI</button>`;
        } else if (isInr) {
          upiButtonHtml = `<button type="button" class="btn btn-primary btn-sm" disabled title="Ask ${receiver ? memberName(receiver) : "them"} to add a UPI ID in Settings">Pay via UPI</button>`;
        }

        li.innerHTML = `
          <span class="settle-item-name">You owe ${receiver ? memberName(receiver) : ""}</span>
          <span class="settle-item-amount">${formatCurrency(entry.amount, entry.currency)}</span>
          <span class="settle-item-actions">
            ${upiButtonHtml}
            <button type="button" class="btn btn-secondary btn-sm" data-mark-cash='${JSON.stringify({ to: entry.owedTo, amount: entry.amount, currency: entry.currency })}'>Mark as cash</button>
          </span>
        `;
      }

      youOweList.appendChild(li);
    });
  }

  if (data.owedToYou.length === 0) {
    owedToYouEmptyState.classList.add("is-visible");
  } else {
    owedToYouEmptyState.classList.remove("is-visible");

    data.owedToYou.forEach((entry) => {
      const member = data.group.members.find((m) => (m.user._id || m.user) === entry.owes);
      const ower = member ? member.user : null;
      const pending = findPendingPayment(data.group.payments, entry.owes, currentUserId, entry.currency);

      const li = document.createElement("li");
      li.className = "settle-item";

      if (pending) {
        li.innerHTML = `
          <span class="settle-item-name">${ower ? memberName(ower) : ""} owes you</span>
          <span class="settle-item-amount">${formatCurrency(entry.amount, entry.currency)}</span>
          <span class="settle-item-actions">
            <span class="settle-item-status">via ${pending.method}</span>
            <button type="button" class="btn btn-primary btn-sm" data-confirm-payment="${pending._id}">Confirm received</button>
          </span>
        `;
      } else {
        li.innerHTML = `
          <span class="settle-item-name">${ower ? memberName(ower) : ""} owes you</span>
          <span class="settle-item-amount">${formatCurrency(entry.amount, entry.currency)}</span>
          <span class="settle-item-status">Waiting for them to initiate payment</span>
        `;
      }

      owedToYouList.appendChild(li);
    });
  }
}

async function refreshGroup() {
  const data = await fetchGroupById(currentIdToken, groupId);
  currentGroupData = data;
  currentUserId = data.currentUserId;

  groupNameHeading.textContent = data.group.name;
  groupDescriptionEl.textContent = data.group.description || "";
  renderMembers(data.group);
  renderExpenses(data.expenses);
  renderSettleUp(data);

  const requester = data.group.members.find((m) => (m.user._id || m.user) === currentUserId);
  const isAdmin = requester && requester.role === "admin";
  editGroupOpenBtn.style.display = isAdmin ? "block" : "none";
  deleteGroupOpenBtn.style.display = isAdmin ? "block" : "none";

  const canLogExpenses = requester && (requester.role === "admin" || requester.canAddExpense);
  addExpenseOpenBtn.style.display = canLogExpenses ? "inline-flex" : "none";
}

youOweList.addEventListener("click", async (event) => {
  const upiBtn = event.target.closest("[data-pay-upi]");
  const cashBtn = event.target.closest("[data-mark-cash]");

  if (upiBtn) {
    const payload = JSON.parse(upiBtn.dataset.payUpi);
    const upiLink = `upi://pay?pa=${encodeURIComponent(payload.upiId)}&pn=${encodeURIComponent(payload.name)}&am=${payload.amount}&cu=INR&tn=${encodeURIComponent("SplitEasy settlement")}`;

    await createPayment(currentIdToken, groupId, {
      to: payload.to,
      amount: payload.amount,
      currency: payload.currency,
      method: "upi"
    });

    window.location.href = upiLink;
    await refreshGroup();
  }

  if (cashBtn) {
    const payload = JSON.parse(cashBtn.dataset.markCash);
    await createPayment(currentIdToken, groupId, {
      to: payload.to,
      amount: payload.amount,
      currency: payload.currency,
      method: "cash"
    });
    await refreshGroup();
  }
});

owedToYouList.addEventListener("click", async (event) => {
  const confirmBtn = event.target.closest("[data-confirm-payment]");
  if (!confirmBtn) return;

  await confirmPayment(currentIdToken, groupId, confirmBtn.dataset.confirmPayment);
  await refreshGroup();
});

inviteBtn.addEventListener("click", async () => {
  await loadModal("../views/modals/invite-modal.html");

  const inviteLinkInput = document.getElementById("inviteLinkInput");
  const inviteQrContainer = document.getElementById("inviteQrContainer");
  const copyBtn = document.getElementById("copyInviteLinkBtn");
  const regenerateBtn = document.getElementById("regenerateInviteBtn");

  function renderInvite(code) {
    const link = `${window.location.origin}${window.location.pathname.replace("group-details.html", "groups.html")}?join=${code}`;
    inviteLinkInput.value = link;
    renderQrCode(inviteQrContainer, link);
  }

  renderInvite(currentGroupData.inviteCode);

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
});

editGroupOpenBtn.addEventListener("click", async () => {
  groupMenuDropdown.classList.remove("is-open");
  await loadModal("../views/modals/edit-group-modal.html");

  pendingRemovals = new Set();

  document.getElementById("editGroupName").value = currentGroupData.group.name;
  document.getElementById("editGroupDescription").value = currentGroupData.group.description || "";

  const membersContainer = document.getElementById("editGroupMembersList");

  function renderEditableMembers() {
    membersContainer.innerHTML = "";

    currentGroupData.group.members.forEach((member) => {
      const userId = member.user._id || member.user;
      if (pendingRemovals.has(userId)) return;

      const row = document.createElement("div");
      row.className = "member-row";
      row.innerHTML = `
        <span class="member-row-name">${memberName(member.user)}</span>
        <span class="member-row-controls">
          <select data-user-id="${userId}" data-field="role">
            <option value="admin" ${member.role === "admin" ? "selected" : ""}>Admin</option>
            <option value="member" ${member.role === "member" ? "selected" : ""}>Member</option>
          </select>
          <label style="font-size:0.78rem; display:flex; align-items:center; gap:4px;">
            <input type="checkbox" data-user-id="${userId}" data-field="canAddExpense" ${member.canAddExpense ? "checked" : ""} />
            can add expenses
          </label>
          <button type="button" class="member-row-remove" data-remove-user="${userId}">Remove</button>
        </span>
      `;
      membersContainer.appendChild(row);
    });
  }

  renderEditableMembers();

  membersContainer.addEventListener("click", (event) => {
    const removeBtn = event.target.closest("[data-remove-user]");
    if (removeBtn) {
      pendingRemovals.add(removeBtn.dataset.removeUser);
      renderEditableMembers();
    }
  });

  document.getElementById("editGroupForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const banner = document.getElementById("editGroupBanner");
    banner.classList.remove("is-visible");

    const name = document.getElementById("editGroupName").value.trim();
    const description = document.getElementById("editGroupDescription").value.trim();

    const members = [];
    membersContainer.querySelectorAll("select[data-field='role']").forEach((select) => {
      const userId = select.dataset.userId;
      const checkbox = membersContainer.querySelector(`input[data-user-id="${userId}"][data-field="canAddExpense"]`);
      members.push({
        userId,
        role: select.value,
        canAddExpense: checkbox ? checkbox.checked : false
      });
    });

    try {
      await updateGroup(currentIdToken, groupId, {
        name,
        description,
        members,
        removeUserIds: Array.from(pendingRemovals)
      });
      closeModal("editGroupModalOverlay");
      await refreshGroup();
    } catch (error) {
      banner.textContent = error.message;
      banner.classList.add("is-visible", "form-banner-error");
    }
  });

  openModal("editGroupModalOverlay");
});

deleteGroupOpenBtn.addEventListener("click", async () => {
  groupMenuDropdown.classList.remove("is-open");
  await loadModal("../views/modals/confirm-delete-modal.html");

  document.getElementById("confirmDeleteConfirmBtn").addEventListener("click", async () => {
    await deleteGroup(currentIdToken, groupId);
    window.location.href = ROUTES.DASHBOARD.replace("dashboard.html", "groups.html");
  });

  openModal("confirmDeleteModalOverlay");
});

addExpenseOpenBtn.addEventListener("click", async () => {
  await loadModal("../views/modals/add-expense-modal.html");

  const paidBySelect = document.getElementById("expensePaidBy");
  const participantPicker = document.getElementById("expenseParticipantPicker");
  const selectedParticipants = new Set(currentGroupData.group.members.map((m) => m.user._id || m.user));

  paidBySelect.innerHTML = "";
  participantPicker.innerHTML = "";

  currentGroupData.group.members.forEach((member) => {
    const userId = member.user._id || member.user;

    const option = document.createElement("option");
    option.value = userId;
    option.textContent = memberName(member.user);
    paidBySelect.appendChild(option);

    const chip = document.createElement("span");
    chip.className = "participant-chip is-selected";
    chip.dataset.userId = userId;
    chip.textContent = memberName(member.user);
    participantPicker.appendChild(chip);
  });

  participantPicker.addEventListener("click", (event) => {
    const chip = event.target.closest(".participant-chip");
    if (!chip) return;

    const userId = chip.dataset.userId;
    if (selectedParticipants.has(userId)) {
      selectedParticipants.delete(userId);
      chip.classList.remove("is-selected");
    } else {
      selectedParticipants.add(userId);
      chip.classList.add("is-selected");
    }
  });

  document.getElementById("addExpenseForm").addEventListener("submit", async (event) => {
    event.preventDefault();
    const banner = document.getElementById("addExpenseBanner");
    banner.classList.remove("is-visible");

    const description = document.getElementById("expenseDescription").value.trim();
    const amount = document.getElementById("expenseAmount").value;
    const currency = document.getElementById("expenseCurrency").value;
    const paidBy = paidBySelect.value;
    const receiptFile = document.getElementById("expenseReceiptInput").files[0];

    if (receiptFile) {
      const validation = isValidPhotoFile(receiptFile);
      if (!validation.valid) {
        banner.textContent = validation.message;
        banner.classList.add("is-visible", "form-banner-error");
        return;
      }
    }

    if (selectedParticipants.size === 0) {
      banner.textContent = "Select at least one participant";
      banner.classList.add("is-visible", "form-banner-error");
      return;
    }

    const formData = new FormData();
    formData.append("description", description);
    formData.append("amount", amount);
    formData.append("currency", currency);
    formData.append("paidBy", paidBy);
    formData.append("participantIds", JSON.stringify(Array.from(selectedParticipants)));
    if (receiptFile) formData.append("receipt", receiptFile);

    try {
      await createExpense(currentIdToken, groupId, formData);
      closeModal("addExpenseModalOverlay");
      await refreshGroup();
    } catch (error) {
      banner.textContent = error.message;
      banner.classList.add("is-visible", "form-banner-error");
    }
  });

  openModal("addExpenseModalOverlay");
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
  await refreshGroup();
});