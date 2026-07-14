function roundCurrency(amount) {
  return Math.round(Number(amount) * 100) / 100;
}

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

module.exports = { roundCurrency, isNonEmptyString };