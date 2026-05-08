const mongoose = require("mongoose");

const platformOptions = ["Instagram", "YouTube", "TikTok", "Twitter", "LinkedIn", "Facebook", "Twitch", "Pinterest", "Snapchat"];
const statusOptions = ["draft", "published", "closed"];

const campaignSchema = new mongoose.Schema(
  {
    company: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    category: {
      type: [String],
      required: true,
      default: [],
    },
    platforms: {
      type: [String],
      required: true,
      enum: platformOptions,
    },
    budgetMin: {
      type: Number,
      required: true,
      min: 0,
    },
    budgetMax: {
      type: Number,
      required: true,
      min: 0,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: statusOptions,
      default: "draft",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Campaign", campaignSchema);
