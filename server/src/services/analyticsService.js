const { roundCurrency } = require("../utils/helpers");

function keyFor(userId) {
  return userId.toString();
}

function ensurePath(ledger, fromId, toId, currency) {
  if (!ledger[fromId]) ledger[fromId] = {};
  if (!ledger[fromId][toId]) ledger[fromId][toId] = {};
  if (!ledger[fromId][toId][currency]) ledger[fromId][toId][currency] = 0;
}

function computeGroupLedger(expenses, payments) {
  const ledger = {};

  expenses.forEach((expense) => {
    const payerId = keyFor(expense.paidBy._id || expense.paidBy);
    const currency = expense.currency;

    expense.participants.forEach((participant) => {
      const participantId = keyFor(participant.user._id || participant.user);
      if (participantId === payerId) return;

      ensurePath(ledger, participantId, payerId, currency);
      ledger[participantId][payerId][currency] += participant.share;
    });
  });

  payments
    .filter((payment) => payment.status === "confirmed")
    .forEach((payment) => {
      const fromId = keyFor(payment.from._id || payment.from);
      const toId = keyFor(payment.to._id || payment.to);
      const currency = payment.currency;

      ensurePath(ledger, fromId, toId, currency);
      ledger[fromId][toId][currency] -= payment.amount;
    });

  return ledger;
}

function netPairwiseBalances(ledger) {
  const seenPairs = new Set();
  const results = [];

  Object.keys(ledger).forEach((fromId) => {
    Object.keys(ledger[fromId]).forEach((toId) => {
      const pairKey = [fromId, toId].sort().join(":");
      if (seenPairs.has(pairKey)) return;
      seenPairs.add(pairKey);

      const forward = ledger[fromId]?.[toId] || {};
      const backward = ledger[toId]?.[fromId] || {};
      const currencies = new Set([...Object.keys(forward), ...Object.keys(backward)]);

      currencies.forEach((currency) => {
        const net = (forward[currency] || 0) - (backward[currency] || 0);
        const rounded = roundCurrency(net);

        if (rounded > 0) {
          results.push({ owes: fromId, owedTo: toId, amount: rounded, currency });
        } else if (rounded < 0) {
          results.push({ owes: toId, owedTo: fromId, amount: Math.abs(rounded), currency });
        }
      });
    });
  });

  return results;
}

function computeGroupBalances(expenses, payments) {
  const ledger = computeGroupLedger(expenses, payments);
  return netPairwiseBalances(ledger);
}

function balancesForUser(balances, userId) {
  const id = userId.toString();
  const youOwe = balances.filter((b) => b.owes === id);
  const owedToYou = balances.filter((b) => b.owedTo === id);
  return { youOwe, owedToYou };
}

module.exports = { computeGroupBalances, balancesForUser };