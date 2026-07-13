const CURRENCY_SYMBOLS = {
  INR: "\u20b9",
  USD: "$",
  EUR: "\u20ac",
  GBP: "\u00a3"
};

export function formatCurrency(amount, currency) {
  const symbol = CURRENCY_SYMBOLS[currency] || `${currency} `;
  const rounded = Math.round(Number(amount) * 100) / 100;
  return `${symbol}${rounded.toLocaleString("en-IN")}`;
}

export function timeAgo(dateInput) {
  const date = new Date(dateInput);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;

  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;

  const years = Math.floor(months / 12);
  return `${years}y ago`;
}

export function initialsFromName(name) {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  const first = parts[0]?.[0] || "";
  const second = parts[1]?.[0] || "";
  return (first + second).toUpperCase() || "?";
}