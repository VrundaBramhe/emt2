const mongoose = require("mongoose");

const expenseSchema = new mongoose.Schema(
  {
    trip: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Trip",
      required: true,
    },
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: String,
      enum: ["travel", "accommodation", "food", "transport", "other"],
      default: "other",
    },
    merchantName: {
      type: String,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
    date: {
      type: Date,
      required: true,
      // Date the employee is filing/logging the expense as
    },
    billDate: {
      type: Date,
      // Actual date printed on the receipt, extracted via OCR (may differ from `date`)
    },
    paymentMethod: {
      type: String,
      enum: ["cash", "personal_card", "company_card", "other"],
      default: "cash",
    },
    description: {
      type: String,
      trim: true,
    },
    receiptUrl: {
      type: String,
      required: true,
    },
    receiptPublicId: {
      type: String,
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    adminComment: {
      type: String,
      trim: true,
    },
    isPolicyViolation: {
      type: Boolean,
      default: false,
    },
    policyViolationReason: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Expense", expenseSchema);