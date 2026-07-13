const Group = require("../models/Group");
const Expense = require("../models/Expense");
const User = require("../models/User");
const cloudinary = require("../config/cloudinary");

async function getCurrentAppUser(req) {
  return User.findOne({ firebaseUid: req.firebaseUser.uid });
}

function findMember(group, userId) {
  return group.members.find((member) => {
    const memberId = member.user._id || member.user;
    return memberId.toString() === userId.toString();
  });
}

function canLogExpenses(member) {
  return member && (member.role === "admin" || member.canAddExpense);
}

function streamUpload(buffer) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: "spliteasy/receipts" },
      (error, result) => {
        if (result) resolve(result);
        else reject(error);
      }
    );
    stream.end(buffer);
  });
}

async function createExpense(req, res) {
  const { description, amount, currency, paidBy, participantIds } = req.body;

  try {
    const currentUser = await getCurrentAppUser(req);
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const requester = findMember(group, currentUser._id);
    if (!canLogExpenses(requester)) {
      return res.status(403).json({ message: "You don't have permission to add expenses in this group" });
    }

    const payerIsMember = findMember(group, paidBy);
    if (!payerIsMember) {
      return res.status(400).json({ message: "The selected payer isn't a member of this group" });
    }

    const invalidParticipant = participantIds.find((id) => !findMember(group, id));
    if (invalidParticipant) {
      return res.status(400).json({ message: "One of the selected participants isn't in this group" });
    }

    const shareAmount = Math.round((amount / participantIds.length) * 100) / 100;
    const participants = participantIds.map((id) => ({ user: id, share: shareAmount }));

    let receiptUrl = "";
    let receiptPublicId = "";

    if (req.file) {
      const result = await streamUpload(req.file.buffer);
      receiptUrl = result.secure_url;
      receiptPublicId = result.public_id;
    }

    const expense = await Expense.create({
      group: group._id,
      description: description.trim(),
      amount,
      currency: currency.trim().toUpperCase(),
      paidBy,
      participants,
      receiptUrl,
      receiptPublicId,
      addedBy: currentUser._id
    });

    await expense.populate("paidBy", "username fullName");
    await expense.populate("participants.user", "username fullName");

    res.status(201).json({ expense });
  } catch (error) {
    res.status(500).json({ message: "Could not add expense", error: error.message });
  }
}

async function getGroupExpenses(req, res) {
  try {
    const currentUser = await getCurrentAppUser(req);
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!findMember(group, currentUser._id)) {
      return res.status(403).json({ message: "You're not a member of this group" });
    }

    const expenses = await Expense.find({ group: group._id })
      .populate("paidBy", "username fullName")
      .populate("participants.user", "username fullName")
      .populate("addedBy", "username fullName")
      .sort({ createdAt: -1 });

    res.status(200).json({ expenses });
  } catch (error) {
    res.status(500).json({ message: "Could not fetch expenses", error: error.message });
  }
}

async function createPayment(req, res) {
  const { to, amount, currency, method } = req.body;

  try {
    const currentUser = await getCurrentAppUser(req);
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const requester = findMember(group, currentUser._id);
    const receiver = findMember(group, to);

    if (!requester) {
      return res.status(403).json({ message: "You're not a member of this group" });
    }

    if (!receiver) {
      return res.status(400).json({ message: "The selected recipient isn't in this group" });
    }

    const isAdmin = requester.role === "admin";
    const isSelfInitiated = req.body.from ? req.body.from === currentUser._id.toString() : true;

    if (!isAdmin && !isSelfInitiated) {
      return res.status(403).json({ message: "Only an admin can log a payment on someone else's behalf" });
    }

    const fromUserId = req.body.from || currentUser._id;

    group.payments.push({
      from: fromUserId,
      to,
      amount,
      currency: currency.trim().toUpperCase(),
      method,
      status: "pending",
      initiatedBy: currentUser._id
    });

    await group.save();
    res.status(201).json({ message: "Payment recorded as pending", payments: group.payments });
  } catch (error) {
    res.status(500).json({ message: "Could not record payment", error: error.message });
  }
}

async function confirmPayment(req, res) {
  try {
    const currentUser = await getCurrentAppUser(req);
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const payment = group.payments.id(req.params.paymentId);
    if (!payment) {
      return res.status(404).json({ message: "Payment record not found" });
    }

    if (payment.to.toString() !== currentUser._id.toString()) {
      return res.status(403).json({ message: "Only the recipient can confirm this payment" });
    }

    payment.status = "confirmed";
    payment.confirmedAt = new Date();

    await group.save();
    res.status(200).json({ message: "Payment confirmed", payment });
  } catch (error) {
    res.status(500).json({ message: "Could not confirm payment", error: error.message });
  }
}

module.exports = { createExpense, getGroupExpenses, createPayment, confirmPayment };