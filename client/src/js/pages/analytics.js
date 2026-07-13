import { watchAuthState, signOutUser } from "../services/auth-service.js";
import { API_BASE_URL, ROUTES } from "../utils/constants.js";
import { formatCurrency } from "../utils/formatters.js";

const sidebarToggle = document.getElementById("sidebarToggle");
const logoutBtn = document.getElementById("logoutBtn");
const currencySummaryGrid = document.getElementById("currencySummaryGrid");
const analyticsEmptyState = document.getElementById("analyticsEmptyState");
const trendSection = document.getElementById("trendSection");
const trendChartsContainer = document.getElementById("trendChartsContainer");
const topExpensesSection = document.getElementById("topExpensesSection");
const topExpensesList = document.getElementById("topExpensesList");
const groupBreakdownSection = document.getElementById("groupBreakdownSection");
const groupBreakdownList = document.getElementById("groupBreakdownList");

let currentIdToken = null;

async function fetchAnalyticsSummary(idToken) {
  const response = await fetch(`${API_BASE_URL}/analytics/summary`, {
    headers: { Authorization: `Bearer ${idToken}` }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || "Could not load analytics");
  }
  return data;
}

function renderCurrencySummary(perCurrency) {
  currencySummaryGrid.innerHTML = "";
  const currencies = Object.keys(perCurrency);

  currencies.forEach((currency) => {
    const { youOwe, owedToYou } = perCurrency[currency];
    const net = owedToYou - youOwe;

    const card = document.createElement("div");
    card.className = "currency-card";
    card.innerHTML = `
      <div class="currency-card-code">${currency}</div>
      <div class="currency-card-row">
        <span class="currency-card-row-label">You owe</span>
        <span class="currency-card-row-value" style="color: var(--color-danger);">${formatCurrency(youOwe, currency)}</span>
      </div>
      <div class="currency-card-row">
        <span class="currency-card-row-label">You are owed</span>
        <span class="currency-card-row-value" style="color: var(--color-success);">${formatCurrency(owedToYou, currency)}</span>
      </div>
      <div class="currency-card-net">
        <span>Net</span>
        <span style="color: ${net >= 0 ? "var(--color-success)" : "var(--color-danger)"};">${formatCurrency(net, currency)}</span>
      </div>
    `;
    currencySummaryGrid.appendChild(card);
  });

  return currencies.length;
}

function renderMonthlyTrend(monthlyTrend) {
  trendChartsContainer.innerHTML = "";

  if (monthlyTrend.length === 0) {
    trendSection.style.display = "none";
    return;
  }

  trendSection.style.display = "block";

  const byCurrency = {};
  monthlyTrend.forEach((entry) => {
    if (!byCurrency[entry.currency]) byCurrency[entry.currency] = [];
    byCurrency[entry.currency].push(entry);
  });

  Object.keys(byCurrency).forEach((currency) => {
    const series = byCurrency[currency];
    const maxAmount = Math.max(...series.map((entry) => entry.amount), 1);

    const block = document.createElement("div");
    block.className = "chart-block";
    block.innerHTML = `<div class="chart-block-title">${currency} \u00b7 your share by month</div>`;

    const chart = document.createElement("div");
    chart.className = "bar-chart";

    series.forEach((entry) => {
      const heightPercent = Math.max((entry.amount / maxAmount) * 100, 3);
      const column = document.createElement("div");
      column.className = "bar-chart-column";
      column.innerHTML = `
        <span class="bar-chart-value">${formatCurrency(entry.amount, currency)}</span>
        <div class="bar-chart-bar" style="height: ${heightPercent}%;"></div>
        <span class="bar-chart-label">${entry.month}</span>
      `;
      chart.appendChild(column);
    });

    block.appendChild(chart);
    trendChartsContainer.appendChild(block);
  });
}

function renderTopExpenses(topExpenses) {
  topExpensesList.innerHTML = "";

  if (topExpenses.length === 0) {
    topExpensesSection.style.display = "none";
    return;
  }

  topExpensesSection.style.display = "block";

  topExpenses.forEach((expense) => {
    const li = document.createElement("li");
    li.className = "top-expense-item";
    li.innerHTML = `
      <div>
        <div class="top-expense-title">${expense.description}</div>
        <div class="top-expense-meta">${expense.groupName} \u00b7 paid by ${expense.paidBy}</div>
      </div>
      <span class="top-expense-amount">${formatCurrency(expense.share, expense.currency)}</span>
    `;
    topExpensesList.appendChild(li);
  });
}

function renderGroupBreakdown(groupBreakdown) {
  groupBreakdownList.innerHTML = "";

  if (groupBreakdown.length === 0) {
    groupBreakdownSection.style.display = "none";
    return;
  }

  groupBreakdownSection.style.display = "block";

  groupBreakdown.forEach((group) => {
    const li = document.createElement("li");
    li.className = "group-breakdown-item";

    const rows = [
      ...group.youOwe.map((b) => `<div class="group-breakdown-row"><span>You owe</span><span style="color: var(--color-danger); font-family: var(--font-mono);">${formatCurrency(b.amount, b.currency)}</span></div>`),
      ...group.owedToYou.map((b) => `<div class="group-breakdown-row"><span>Owed to you</span><span style="color: var(--color-success); font-family: var(--font-mono);">${formatCurrency(b.amount, b.currency)}</span></div>`)
    ].join("");

    li.innerHTML = `<div class="group-breakdown-name">${group.groupName}</div>${rows}`;
    groupBreakdownList.appendChild(li);
  });
}

async function loadAnalytics() {
  try {
    const data = await fetchAnalyticsSummary(currentIdToken);
    const currencyCount = renderCurrencySummary(data.perCurrency);

    if (currencyCount === 0 && data.groupBreakdown.length === 0 && data.topExpenses.length === 0) {
      analyticsEmptyState.classList.add("is-visible");
    } else {
      analyticsEmptyState.classList.remove("is-visible");
    }

    renderMonthlyTrend(data.monthlyTrend);
    renderTopExpenses(data.topExpenses);
    renderGroupBreakdown(data.groupBreakdown);
  } catch (error) {
    console.error("Could not load analytics:", error);
    analyticsEmptyState.textContent = "Couldn't load analytics. Check that the backend server is running.";
    analyticsEmptyState.classList.add("is-visible");
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

  currentIdToken = await firebaseUser.getIdToken();
  await loadAnalytics();
});