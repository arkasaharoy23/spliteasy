import { formatCurrency } from "../utils/formatters.js";

export function renderGroupCard(group) {
  const totalOwe = group.youOwe.reduce((sum, b) => sum + b.amount, 0);
  const totalOwed = group.owedToYou.reduce((sum, b) => sum + b.amount, 0);

  let balanceHtml = `<span class="group-card-balance balance-neutral">All settled up</span>`;

  if (group.youOwe.length > 0 && group.owedToYou.length === 0) {
    balanceHtml = `<span class="group-card-balance balance-negative">You owe ${formatCurrency(totalOwe, group.youOwe[0].currency)}</span>`;
  } else if (group.owedToYou.length > 0 && group.youOwe.length === 0) {
    balanceHtml = `<span class="group-card-balance balance-positive">You are owed ${formatCurrency(totalOwed, group.owedToYou[0].currency)}</span>`;
  } else if (group.youOwe.length > 0 && group.owedToYou.length > 0) {
    balanceHtml = `<span class="group-card-balance balance-mixed">You owe and are owed</span>`;
  }

  const card = document.createElement("a");
  card.href = `group-details.html?groupId=${group._id}`;
  card.className = "group-card card";
  card.innerHTML = `
    <div class="group-card-header">
      <div class="group-card-avatar">${group.name.slice(0, 2).toUpperCase()}</div>
      <div>
        <div class="group-card-name">${group.name}</div>
        <div class="group-card-meta">${group.memberCount} members</div>
      </div>
    </div>
    ${balanceHtml}
  `;

  return card;
}