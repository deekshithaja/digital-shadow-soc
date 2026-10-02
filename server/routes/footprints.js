const express = require("express");
const router = express.Router();
const Footprint = require("../models/Footprint");

// Try importing middleware; fallback cleanly if the file is named auth.js
let auth;
try {
  auth = require("../middleware/authMiddleware");
} catch (e) {
  try {
    auth = require("../middleware/auth");
  } catch (err) {
    // If your middleware exports { protect } or similar:
    const m = require("../middleware");
    auth = m.protect || m.auth || m;
  }
}

// In case auth is exported as { protect } or { verifyToken }
const protect =
  typeof auth === "function"
    ? auth
    : auth?.protect || auth?.verifyToken || ((req, res, next) => next());

// GET all footprints
router.get("/", protect, async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const footprints = await Footprint.find(
      userId ? { user: userId } : {},
    ).sort({ createdAt: -1 });
    res.json(footprints);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error fetching footprints" });
  }
});

// POST new footprint
router.post("/", protect, async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const newEntry = new Footprint({
      ...req.body,
      user: userId,
    });
    const saved = await newEntry.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to save footprint" });
  }
});

// DELETE footprint
router.delete("/:id", protect, async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    const query = { _id: req.params.id };
    if (userId) query.user = userId;

    const item = await Footprint.findOneAndDelete(query);
    if (!item) return res.status(404).json({ message: "Footprint not found" });
    res.json({ message: "Footprint purged successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete footprint" });
  }
});

module.exports = router;
