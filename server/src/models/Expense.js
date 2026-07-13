const mongoose = require("mongoose");

const participantSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    share: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);

const expenseSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: "Group", required: true, index: true },
    description: { type: String, required: true, trim: true, maxlength: 120 },
    amount: { type: Number, required: true, min: 0.01 },
    currency: { type: String, required: true, uppercase: true, trim: true },
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    participants: {
      type: [participantSchema],
      validate: {
        validator: (value) => Array.isArray(value) && value.length > 0,
        message: "At least one participant is required"
      }
    },
    receiptUrl: { type: String, default: "" },
    receiptPublicId: { type: String, default: "" },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Expense", expenseSchema);