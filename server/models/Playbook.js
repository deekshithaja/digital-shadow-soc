const mongoose = require("mongoose");

const PlaybookItemSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    taskId: { type: Number, required: true },
    title: { type: String, required: true },
    desc: { type: String, required: true },
    severity: { type: String, default: "MEDIUM" },
    done: { type: Boolean, default: false },
  },
  { timestamps: true },
);

module.exports = mongoose.model("PlaybookItem", PlaybookItemSchema);
