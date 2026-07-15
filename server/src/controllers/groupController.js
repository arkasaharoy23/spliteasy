const Group = require("../models/Group");
const Expense = require("../models/Expense");
const User = require("../models/User");
const Invite = require("../models/Invite");
const { createInvite, getActiveInvite } = require("../services/inviteService");
const { computeGroupBalances, balancesForUser } = require("../services/analyticsService");
const { notify, notifyMany } = require("../services/notificationService");

async function getCurrentAppUser(req) {
  return User.findOne({ firebaseUid: req.firebaseUser.uid });
}

function findMember(group, userId) {
  return group.members.find((member) => {
    const memberId = member.user._id || member.user;
    return memberId.toString() === userId.toString();
  });
}

async function createGroup(req, res) {
  const { name, description } = req.body;

  try {
    const currentUser = await getCurrentAppUser(req);
    if (!currentUser) {
      return res.status(404).json({ message: "Complete your profile before creating a group" });
    }

    const group = await Group.create({
      name: name.trim(),
      description: (description || "").trim(),
      createdBy: currentUser._id,
      members: [{ user: currentUser._id, role: "admin", canAddExpense: true }]
    });

    const invite = await createInvite(group._id, currentUser._id);

    res.status(201).json({ group, inviteCode: invite.code });
  } catch (error) {
    res.status(500).json({ message: "Could not create group", error: error.message });
  }
}

async function getMyGroups(req, res) {
  try {
    const currentUser = await getCurrentAppUser(req);
    if (!currentUser) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const groups = await Group.find({ "members.user": currentUser._id }).sort({ updatedAt: -1 });

    const groupsWithBalances = await Promise.all(
      groups.map(async (group) => {
        const expenses = await Expense.find({ group: group._id })
          .populate("paidBy", "username fullName")
          .populate("participants.user", "username fullName");

        const balances = computeGroupBalances(expenses, group.payments);
        const { youOwe, owedToYou } = balancesForUser(balances, currentUser._id);

        return {
          _id: group._id,
          name: group.name,
          description: group.description,
          memberCount: group.members.length,
          youOwe,
          owedToYou
        };
      })
    );

    res.status(200).json({ groups: groupsWithBalances });
  } catch (error) {
    res.status(500).json({ message: "Could not fetch groups", error: error.message });
  }
}

async function getGroupById(req, res) {
  try {
    const currentUser = await getCurrentAppUser(req);
    if (!currentUser) {
      return res.status(404).json({ message: "Profile not found" });
    }

    const group = await Group.findById(req.params.id)
      .populate("members.user", "username fullName profilePhotoUrl upiId")
      .populate("payments.from payments.to payments.initiatedBy", "username fullName");

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (!findMember(group, currentUser._id)) {
      return res.status(403).json({ message: "You're not a member of this group" });
    }

    const invite = await getActiveInvite(group._id);

    const expenses = await Expense.find({ group: group._id })
      .populate("paidBy", "username fullName")
      .populate("participants.user", "username fullName")
      .populate("addedBy", "username fullName")
      .sort({ createdAt: -1 });

    const balances = computeGroupBalances(expenses, group.payments);
    const { youOwe, owedToYou } = balancesForUser(balances, currentUser._id);

    res.status(200).json({
      group,
      inviteCode: invite ? invite.code : null,
      expenses,
      youOwe,
      owedToYou,
      currentUserId: currentUser._id
    });
  } catch (error) {
    res.status(500).json({ message: "Could not fetch group", error: error.message });
  }
}

async function updateGroup(req, res) {
  const { name, description, members } = req.body;

  try {
    const currentUser = await getCurrentAppUser(req);
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const requester = findMember(group, currentUser._id);
    if (!requester || requester.role !== "admin") {
      return res.status(403).json({ message: "Only an admin can edit this group" });
    }

    if (name) group.name = name.trim();
    if (description !== undefined) group.description = description.trim();

    if (Array.isArray(members)) {
      members.forEach((update) => {
        const member = findMember(group, update.userId);
        if (!member) return;

        if (update.role && ["admin", "member"].includes(update.role)) {
          member.role = update.role;
        }
        if (typeof update.canAddExpense === "boolean") {
          member.canAddExpense = update.canAddExpense;
        }
      });

      const remainingAdmins = group.members.filter((m) => m.role === "admin");
      if (remainingAdmins.length === 0) {
        return res.status(400).json({ message: "A group must keep at least one admin" });
      }

      if (Array.isArray(req.body.removeUserIds)) {
        group.members = group.members.filter(
          (m) => !req.body.removeUserIds.includes(m.user.toString())
        );
      }
    }

    await group.save();
    res.status(200).json({ group });
  } catch (error) {
    res.status(500).json({ message: "Could not update group", error: error.message });
  }
}

async function deleteGroup(req, res) {
  try {
    const currentUser = await getCurrentAppUser(req);
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const requester = findMember(group, currentUser._id);
    if (!requester || requester.role !== "admin") {
      return res.status(403).json({ message: "Only an admin can delete this group" });
    }

    await Expense.deleteMany({ group: group._id });
    await group.deleteOne();

    res.status(200).json({ message: "Group deleted" });
  } catch (error) {
    res.status(500).json({ message: "Could not delete group", error: error.message });
  }
}

async function regenerateInvite(req, res) {
  try {
    const currentUser = await getCurrentAppUser(req);
    const group = await Group.findById(req.params.id);

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    const requester = findMember(group, currentUser._id);
    if (!requester || requester.role !== "admin") {
      return res.status(403).json({ message: "Only an admin can regenerate the invite" });
    }

    const invite = await createInvite(group._id, currentUser._id);
    res.status(200).json({ inviteCode: invite.code });
  } catch (error) {
    res.status(500).json({ message: "Could not regenerate invite", error: error.message });
  }
}

async function getInvitePreview(req, res) {
  try {
    const invite = await Invite.findOne({ code: req.params.code, isActive: true });

    if (!invite) {
      return res.status(404).json({ message: "This invite link is invalid or has expired" });
    }

    const group = await Group.findById(invite.group);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    res.status(200).json({
      groupId: group._id,
      groupName: group.name,
      description: group.description,
      memberCount: group.members.length
    });
  } catch (error) {
    res.status(500).json({ message: "Could not load invite", error: error.message });
  }
}

async function joinGroupByInviteCode(req, res) {
  try {
    const currentUser = await getCurrentAppUser(req);
    if (!currentUser) {
      return res.status(404).json({ message: "Complete your profile before joining a group" });
    }

    const invite = await Invite.findOne({ code: req.params.code, isActive: true });

    if (!invite) {
      return res.status(404).json({ message: "This invite link is invalid or has expired" });
    }

    const group = await Group.findById(invite.group);
    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    if (findMember(group, currentUser._id)) {
      return res.status(200).json({ message: "You're already a member of this group", group });
    }

    group.members.push({ user: currentUser._id, role: "member", canAddExpense: false });
    await group.save();

    const adminIds = group.members.filter((m) => m.role === "admin").map((m) => m.user);
    await notifyMany(
      adminIds,
      "member_joined",
      `${currentUser.username} joined "${group.name}"`,
      group._id
    );

    res.status(200).json({ message: "Joined group successfully", group });
  } catch (error) {
    res.status(500).json({ message: "Could not join group", error: error.message });
  }
}

module.exports = {
  createGroup,
  getMyGroups,
  getGroupById,
  updateGroup,
  deleteGroup,
  regenerateInvite,
  getInvitePreview,
  joinGroupByInviteCode
};