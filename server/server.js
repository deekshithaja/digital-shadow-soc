const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✓ MongoDB Atlas Connected Successfully"))
  .catch((err) => {
    console.error("✗ MongoDB Connection Error:", err.message);
    process.exit(1);
  });

// API Routes
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/footprints", require("./routes/footprints"));
app.use("/api/playbook", require("./routes/playbookRoutes"));

// Health Check
app.get("/health", (req, res) => {
  res.json({ status: "active", node: "digital-shadow-core" });
});

// Server Initialization
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✓ Digital Shadow SOC Server running on port ${PORT}`);
});
