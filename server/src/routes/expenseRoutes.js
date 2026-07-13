const express = require("express");
const verifyFirebaseToken = require("../middleware/auth");
const upload = require("../middleware/upload");
const { validateCreateExpense, validateCreatePayment } = require("../middleware/validation");
const {
  createExpense,
  getGroupExpenses,
  createPayment,
  confirmPayment
} = require("../controllers/expenseController");

const router = express.Router();

router.post(
  "/:id/expenses",
  verifyFirebaseToken,
  upload.single("receipt"),
  validateCreateExpense,
  createExpense
);
router.get("/:id/expenses", verifyFirebaseToken, getGroupExpenses);
router.post("/:id/payments", verifyFirebaseToken, validateCreatePayment, createPayment);
router.patch("/:id/payments/:paymentId/confirm", verifyFirebaseToken, confirmPayment);

module.exports = router;