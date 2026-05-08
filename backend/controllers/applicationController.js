const mongoose = require("mongoose");
const Application = require("../models/Application");
const Campaign = require("../models/Campaign");
const InfluencerProfile = require("../models/InfluencerProfile");
const { calculateMatchScore } = require("../utils/matching");

const respondToCampaign = async (req, res) => {
  try {
    const { campaignId, action } = req.body;

    if (!campaignId || !action) {
      return res.status(400).json({
        message: "campaignId and action are required.",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return res.status(400).json({ message: "Invalid campaign id." });
    }

    if (!["accept", "skip"].includes(action)) {
      return res.status(400).json({
        message: "action must be either accept or skip.",
      });
    }

    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found." });
    }

    if (campaign.status !== "published") {
      return res.status(400).json({
        message: "Only published campaigns can be accepted or skipped.",
      });
    }

    const influencerProfile = await InfluencerProfile.findOne({ user: req.user.id });

    if (!influencerProfile) {
      return res.status(400).json({
        message: "Complete your influencer profile first.",
      });
    }

    const existingApplication = await Application.findOne({
      campaign: campaignId,
      influencer: req.user.id,
    });

    if (existingApplication) {
      return res.status(409).json({
        message: "You already responded to this campaign.",
      });
    }

    const matchScore = calculateMatchScore(campaign, influencerProfile);

    const application = await Application.create({
      campaign: campaignId,
      influencer: req.user.id,
      status: action === "accept" ? "accepted" : "skipped",
      matchScore,
    });

    return res.status(201).json({
      message: action === "accept" ? "Campaign accepted." : "Campaign skipped.",
      application,
    });
  } catch (error) {
    // Defensive duplicate handling if race condition occurs.
    if (error?.code === 11000) {
      return res.status(409).json({
        message: "You already responded to this campaign.",
      });
    }

    return res.status(500).json({
      message: "Server error while responding to campaign.",
    });
  }
};

const getMyApplications = async (req, res) => {
  try {
    const applications = await Application.find({ influencer: req.user.id })
      .populate("campaign")
      .sort({ createdAt: -1 });

    return res.status(200).json({ applications });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while fetching your applications.",
    });
  }
};

const getApplicantsForCompanyCampaign = async (req, res) => {
  try {
    const { campaignId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
      return res.status(400).json({ message: "Invalid campaign id." });
    }

    const campaign = await Campaign.findById(campaignId);

    if (!campaign) {
      return res.status(404).json({ message: "Campaign not found." });
    }

    if (campaign.company.toString() !== req.user.id) {
      return res.status(403).json({
        message: "You can view applicants only for your own campaigns.",
      });
    }

    const applications = await Application.find({
      campaign: campaignId,
    })
      .populate("influencer", "name email role")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      campaign: {
        id: campaign._id,
        title: campaign.title,
        status: campaign.status,
      },
      applicants: applications,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while fetching campaign applicants.",
    });
  }
};

module.exports = {
  respondToCampaign,
  getMyApplications,
  getApplicantsForCompanyCampaign,
};
