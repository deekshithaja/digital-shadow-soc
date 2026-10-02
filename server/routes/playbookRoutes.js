const express = require("express");
const router = express.Router();
const PlaybookItem = require("../models/Playbook");

let auth;
try {
  auth = require("../middleware/authMiddleware");
} catch (e) {
  try {
    auth = require("../middleware/auth");
  } catch (err) {
    const m = require("../middleware");
    auth = m.protect || m.auth || m;
  }
}
const protect =
  typeof auth === "function"
    ? auth
    : auth?.protect || auth?.verifyToken || ((req, res, next) => next());

const DEFAULT_PLAYBOOK = [
  {
    taskId: 1,
    title: "Revoke Inactive OAuth Grantees",
    desc: "Scan third-party apps granted access to Google & GitHub identities.",
    severity: "CRITICAL",
    done: false,
  },
  {
    taskId: 2,
    title: "Phase Out SMS-Based 2FA",
    desc: "Migrate SMS-based accounts to hardware Passkeys or TOTP authenticator.",
    severity: "HIGH",
    done: true,
  },
  {
    taskId: 3,
    title: "Flush Browser Canvas & Fingerprint Cache",
    desc: "Purge indexed storage, tracker local cache, and WebRTC leak vectors.",
    severity: "MEDIUM",
    done: false,
  },
  {
    taskId: 4,
    title: "Submit GDPR Article 17 Erasure (Old Commerce)",
    desc: "Transmit statutory right-to-erasure demand to decommissioned vendor databases.",
    severity: "HIGH",
    done: false,
  },
  {
    taskId: 5,
    title: "Audit HaveIBeenPwned & Dark Web Feeds",
    desc: "Check credential exposure in recent comb dumps.",
    severity: "LOW",
    done: true,
  },
];

// GET user playbook tasks (seeds default tasks if user has none)
router.get("/", protect, async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    let items = await PlaybookItem.find(userId ? { user: userId } : {}).sort({
      taskId: 1,
    });

    if (items.length === 0 && userId) {
      const seeded = DEFAULT_PLAYBOOK.map((task) => ({
        ...task,
        user: userId,
      }));
      items = await PlaybookItem.insertMany(seeded);
    }
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: "Error retrieving mitigation playbook" });
  }
});

// PATCH toggle task done/undone
router.patch("/:id/toggle", protect, async (req, res) => {
  try {
    const item = await PlaybookItem.findById(req.params.id);
    if (!item) return res.status(404).json({ message: "Task item not found" });

    item.done = !item.done;
    await item.save();
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: "Failed to update playbook state" });
  }
});

module.exports = router;
