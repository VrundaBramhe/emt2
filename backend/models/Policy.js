const mongoose = require("mongoose");

const policySchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ["travel", "accommodation", "food", "transport", "other"],
      required: true,
      unique: true,
    },
    maxAmountPerExpense: {
      type: Number,
      required: true,
    },
    description: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Policy", policySchema);
