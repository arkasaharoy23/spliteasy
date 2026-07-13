function validateCreateGroup(req, res, next) {
  const { name } = req.body;

  if (!name || name.trim().length < 2) {
    return res.status(400).json({ message: "Group name must be at least 2 characters" });
  }

  next();
}

function validateCreateExpense(req, res, next) {
  const { description, amount, currency, paidBy, participantIds } = req.body;

  if (!description || description.trim().length < 1) {
    return res.status(400).json({ message: "Description is required" });
  }

  const numericAmount = Number(amount);
  if (!numericAmount || numericAmount <= 0) {
    return res.status(400).json({ message: "Amount must be a positive number" });
  }

  if (!currency || currency.trim().length < 3) {
    return res.status(400).json({ message: "Currency is required, e.g. INR, USD, EUR" });
  }

  if (!paidBy) {
    return res.status(400).json({ message: "Select who paid for this expense" });
  }

  let parsedParticipants = participantIds;
  if (typeof participantIds === "string") {
    try {
      parsedParticipants = JSON.parse(participantIds);
    } catch (error) {
      return res.status(400).json({ message: "Invalid participant list" });
    }
  }

  if (!Array.isArray(parsedParticipants) || parsedParticipants.length === 0) {
    return res.status(400).json({ message: "Select at least one participant" });
  }

  req.body.participantIds = parsedParticipants;
  req.body.amount = numericAmount;
  next();
}

function validateCreatePayment(req, res, next) {
  const { to, amount, currency, method } = req.body;

  if (!to) {
    return res.status(400).json({ message: "Select who you're paying" });
  }

  const numericAmount = Number(amount);
  if (!numericAmount || numericAmount <= 0) {
    return res.status(400).json({ message: "Amount must be a positive number" });
  }

  if (!currency) {
    return res.status(400).json({ message: "Currency is required" });
  }

  if (!["upi", "cash"].includes(method)) {
    return res.status(400).json({ message: "Payment method must be upi or cash" });
  }

  req.body.amount = numericAmount;
  next();
}

module.exports = { validateCreateGroup, validateCreateExpense, validateCreatePayment };