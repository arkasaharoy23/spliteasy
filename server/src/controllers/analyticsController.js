const Group = require("../models/Group");
const Expense = require("../models/Expense");
const User = require("../models/User");
const { computeGroupBalances, balancesForUser } = require("../services/analyticsService");

async function getCurrentAppUser(req) {
  return User.findOne({ firebaseUid: req.firebaseUser.uid });
}

function monthKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

async function getMySummary(req, res) {
  try {
    const currentUser = await getCurrentAppUser(req);
    if (!currentUser) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const groups = await Group.find({ "members.user": currentUser._id });

    const perCurrency = {};
    const groupBreakdown = [];
    const monthlyTrendMap = {};
    const allYourExpenses = [];

    for (const group of groups) {
      const expenses = await Expense.find({ group: group._id })
        .populate("paidBy", "username fullName")
        .populate("participants.user", "username fullName");

      const balances = computeGroupBalances(expenses, group.payments);
      const { youOwe, owedToYou } = balancesForUser(balances, currentUser._id);

      youOwe.forEach((entry) => {
        if (!perCurrency[entry.currency]) perCurrency[entry.currency] = { youOwe: 0, owedToYou: 0 };
        perCurrency[entry.currency].youOwe += entry.amount;
      });

      owedToYou.forEach((entry) => {
        if (!perCurrency[entry.currency]) perCurrency[entry.currency] = { youOwe: 0, owedToYou: 0 };
        perCurrency[entry.currency].owedToYou += entry.amount;
      });

      if (youOwe.length > 0 || owedToYou.length > 0) {
        groupBreakdown.push({ groupId: group._id, groupName: group.name, youOwe, owedToYou });
      }

      expenses.forEach((expense) => {
        const yourParticipation = expense.participants.find(
          (p) => (p.user._id || p.user).toString() === currentUser._id.toString()
        );

        if (!yourParticipation) return;

        const key = `${monthKey(expense.createdAt)}_${expense.currency}`;
        if (!monthlyTrendMap[key]) {
          monthlyTrendMap[key] = { month: monthKey(expense.createdAt), currency: expense.currency, amount: 0 };
        }
        monthlyTrendMap[key].amount += yourParticipation.share;

        allYourExpenses.push({
          description: expense.description,
          groupName: group.name,
          share: yourParticipation.share,
          amount: expense.amount,
          currency: expense.currency,
          paidBy: expense.paidBy.fullName || expense.paidBy.username,
          createdAt: expense.createdAt
        });
      });
    }

    const monthlyTrend = Object.values(monthlyTrendMap).sort((a, b) => a.month.localeCompare(b.month));
    const topExpenses = allYourExpenses.sort((a, b) => b.share - a.share).slice(0, 5);

    res.status(200).json({
      groupCount: groups.length,
      perCurrency,
      groupBreakdown,
      monthlyTrend,
      topExpenses
    });
  } catch (error) {
    res.status(500).json({ message: "Could not compute analytics", error: error.message });
  }
}

module.exports = { getMySummary };