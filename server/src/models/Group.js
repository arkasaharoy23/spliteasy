const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["admin", "member"], default: "member" },
    canAddExpense: { type: Boolean, default: false },
    joinedAt: { type: Date, default: Date.now }
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    from: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    to: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    amount: { type: Number, required: true, min: 0.01 },
    currency: { type: String, required: true, uppercase: true, trim: true },
    method: { type: String, enum: ["upi", "cash"], required: true },
    status: { type: String, enum: ["pending", "confirmed"], default: "pending" },
    initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    confirmedAt: { type: Date }
  },
  { timestamps: true }
);

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 60 },
    description: { type: String, trim: true, default: "", maxlength: 200 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    members: { type: [memberSchema], default: [] },
    payments: { type: [paymentSchema], default: [] }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Group", groupSchema);