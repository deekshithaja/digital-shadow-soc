const mongoose = require("mongoose");

const FootprintSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    platform: { type: String, required: true },
    domain: { type: String, default: "" },
    category: { type: String, default: "Productivity & Work" },
    authMethod: { type: String, default: "Master Password" },
    mfaType: { type: String, default: "Authenticator App (TOTP)" },
    exposedVectors: [{ type: String }],
    breached: { type: Boolean, default: false },
    riskRating: { type: String, default: "Low" },
    riskScore: { type: Number, default: 20 },
    oauthScopes: [{ type: String }],
    lastRotated: {
      type: String,
      default: () => new Date().toISOString().split("T")[0],
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Footprint", FootprintSchema);
