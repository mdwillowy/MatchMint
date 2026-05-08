const mongoose = require("mongoose");

const statusOptions = [
  "accepted",
  "skipped",
  "proof_submitted",
  "approved",
  "rejected",
  "ready_for_payment",
  "paid_simulated",
  "completed",
];

const applicationSchema = new mongoose.Schema(
  {
    campaign: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Campaign",
      required: true,
    },
    influencer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      enum: statusOptions,
      required: true,
      default: "accepted",
    },
    matchScore: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    readyForPaymentData: {
      contentLink: String,
      description: String,
      submittedAt: Date,
    },
    paymentInfo: {
      amount: { type: Number },
      companyFeedback: { type: String },
      paidBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      paidTo: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      paidAt: { type: Date },
      transactionIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Transaction" }],
      rejected: { type: Boolean, default: false },
    },
  },
  {
    timestamps: true,
  }
);

applicationSchema.index({ campaign: 1, influencer: 1 }, { unique: true });

module.exports = mongoose.model("Application", applicationSchema);
