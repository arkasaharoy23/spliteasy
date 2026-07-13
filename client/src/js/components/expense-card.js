import { formatCurrency, timeAgo } from "../utils/formatters.js";

export function renderExpenseCard(expense, currentUserId) {
  const payerName = expense.paidBy.fullName || expense.paidBy.username;
  const participantNames = expense.participants
    .map((p) => (p.user.fullName || p.user.username).split(" ")[0])
    .join(", ");

  const yourShare = expense.participants.find(
    (p) => (p.user._id || p.user) === currentUserId
  );

  const li = document.createElement("li");
  li.className = "expense-item";
  li.innerHTML = `
    <div class="expense-item-main">
      <div class="expense-item-title">${expense.description}</div>
      <div class="expense-item-meta">Paid by ${payerName} \u00b7 split with ${participantNames}</div>
    </div>
    <div class="expense-item-side">
      <div class="expense-item-amount">${formatCurrency(expense.amount, expense.currency)}</div>
      ${yourShare ? `<div class="expense-item-share">your share: ${formatCurrency(yourShare.share, expense.currency)}</div>` : ""}
      <div class="expense-item-time">${timeAgo(expense.createdAt)}</div>
    </div>
    ${expense.receiptUrl ? `<a href="${expense.receiptUrl}" target="_blank" rel="noopener" class="expense-item-receipt">Receipt</a>` : ""}
  `;

  return li;
}