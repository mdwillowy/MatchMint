const mongoose = require("mongoose");

const approvalStatusOptions = ["pending", "approved", "rejected"];

const proofSubmissionSchema = new mongoose.Schema(
  {
    application: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Application",
      required: true,
      unique: true,
    },
    proofUrl: {
      type: String,
      required: true,
      trim: true,
    },
    secondaryLink: {
      type: String,
      trim: true,
      default: "",
    },
    screenshotUrl: {
      type: String,
      trim: true,
      default: "",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
    approvalStatus: {
      type: String,
      enum: approvalStatusOptions,
      default: "pending",
    },
    reviewNotes: {
      type: String,
      trim: true,
      default: "",
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ProofSubmission", proofSubmissionSchema);
