const mongoose = require("mongoose");
const Campaign = require("../models/Campaign");
const Application = require("../models/Application");
const User = require("../models/User");

const platformOptions = ["Instagram", "YouTube", "TikTok", "Twitter", "LinkedIn", "Facebook", "Twitch", "Pinterest", "Snapchat"];

const parseAndValidateCampaignPayload = (payload) => {
  const {
    title,
    description,
    category, // legacy single category
    categories, // preferred plural
    platforms,
    budgetMin,
    budgetMax,
    startDate,
    endDate,
  } = payload;

  // Normalize categories input (accept `categories` or `category`)
  let categoryArr = [];
  if (Array.isArray(categories)) {
    categoryArr = categories;
  } else if (Array.isArray(category)) {
    categoryArr = category;
  } else if (typeof categories === "string") {
    categoryArr = [categories];
  } else if (typeof category === "string") {
    categoryArr = [category];
  }

  if (!title || categoryArr.length === 0 || !platforms || !Array.isArray(platforms) || platforms.length === 0 || budgetMin === undefined || budgetMax === undefined || !startDate || !endDate) {
    return {
      isValid: false,
      message: "title, categories (1-3), platforms (at least 1), budgetMin, budgetMax, startDate, and endDate are required.",
    };
  }

  // Validate category count
  if (categoryArr.length === 0 || categoryArr.length > 3) {
    return { isValid: false, message: "categories must contain between 1 and 3 items." };
  }

  // Validate and normalize platform options
  const normalizedPlatforms = platforms.map((p) => String(p).trim());
  for (const p of normalizedPlatforms) {
    if (!platformOptions.includes(p)) {
      return { isValid: false, message: `Invalid platform: ${p}` };
    }
  }

  // Validate budgets
  const budgetMinNumber = Number(budgetMin);
  const budgetMaxNumber = Number(budgetMax);
  if (Number.isNaN(budgetMinNumber) || Number.isNaN(budgetMaxNumber) || budgetMinNumber < 0 || budgetMaxNumber < 0) {
    return { isValid: false, message: "budgetMin and budgetMax must be numbers greater than or equal to 0." };
  }

  if (budgetMaxNumber < budgetMinNumber) {
    return { isValid: false, message: "budgetMax must be greater than or equal to budgetMin." };
  }

  // Validate dates
  const startDateObj = new Date(startDate);
  const endDateObj = new Date(endDate);
  if (Number.isNaN(startDateObj.getTime()) || Number.isNaN(endDateObj.getTime())) {
    return { isValid: false, message: "startDate and endDate must be valid dates." };
  }
  if (endDateObj < startDateObj) {
    return { isValid: false, message: "endDate must be greater than or equal to startDate." };
  }

  // Normalize categories
  const normalizedCategories = categoryArr.map((c) => String(c).trim());

  return {
    isValid: true,
    data: {
      title: String(title).trim(),
      description: description ? String(description).trim() : "",
      category: normalizedCategories,
      platforms: normalizedPlatforms,
      budgetMin: budgetMinNumber,
      budgetMax: budgetMaxNumber,
      startDate: startDateObj,
      endDate: endDateObj,
    },
  };
};

const findOwnedCampaign = async (campaignId, companyId) => {
  if (!mongoose.Types.ObjectId.isValid(campaignId)) {
    return { error: { status: 400, message: "Invalid campaign id." } };
  }

  const campaign = await Campaign.findById(campaignId);

  if (!campaign) {
    return { error: { status: 404, message: "Campaign not found." } };
  }

  if (campaign.company.toString() !== companyId) {
    return { error: { status: 403, message: "You can access only your own campaigns." } };
  }

  return { campaign };
};

const createCampaign = async (req, res) => {
  try {
    const validation = parseAndValidateCampaignPayload(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.message });
    }

    const campaign = await Campaign.create({
      company: req.user.id,
      ...validation.data,
      status: "draft",
    });

    return res.status(201).json({
      message: "Campaign created successfully in draft status.",
      campaign,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error while creating campaign." });
  }
};

const updateCampaign = async (req, res) => {
  try {
    const { campaign, error } = await findOwnedCampaign(req.params.id, req.user.id);
    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    if (campaign.status === "closed") {
      return res.status(400).json({ message: "Closed campaigns cannot be edited." });
    }

    const validation = parseAndValidateCampaignPayload(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ message: validation.message });
    }

    campaign.title = validation.data.title;
    campaign.description = validation.data.description;
    campaign.category = validation.data.category;
    campaign.platforms = validation.data.platforms;
    campaign.budgetMin = validation.data.budgetMin;
    campaign.budgetMax = validation.data.budgetMax;
    campaign.startDate = validation.data.startDate;
    campaign.endDate = validation.data.endDate;

    const updatedCampaign = await campaign.save();

    return res.status(200).json({
      message: "Campaign updated successfully.",
      campaign: updatedCampaign,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error while updating campaign." });
  }
};

const getMyCampaigns = async (req, res) => {
  try {
    const now = new Date();
    
    // Auto-close expired campaigns
    await Campaign.updateMany(
      {
        company: req.user.id,
        status: "published",
        endDate: { $lt: now },
      },
      { status: "closed" }
    );

    const campaigns = await Campaign.find({ company: req.user.id })
      .sort({ createdAt: -1 })
      .lean();
    const campaignIds = campaigns.map((campaign) => campaign._id);
    const activeApplications = campaignIds.length
      ? await Application.aggregate([
          {
            $match: {
              campaign: { $in: campaignIds },
              status: { $ne: "skipped" },
            },
          },
          {
            $group: {
              _id: "$campaign",
              count: { $sum: 1 },
            },
          },
        ])
      : [];
    const activeMap = new Map(
      activeApplications.map((item) => [String(item._id), item.count])
    );
    const campaignsWithFlags = campaigns.map((campaign) => ({
      ...campaign,
      hasAcceptedApplications: activeMap.has(String(campaign._id)),
    }));

    return res.status(200).json({ campaigns: campaignsWithFlags });
  } catch (error) {
    return res.status(500).json({ message: "Server error while fetching campaigns." });
  }
};

const getCampaignById = async (req, res) => {
  try {
    const { campaign, error } = await findOwnedCampaign(req.params.id, req.user.id);
    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    return res.status(200).json({ campaign });
  } catch (error) {
    return res.status(500).json({ message: "Server error while fetching campaign." });
  }
};

const publishCampaign = async (req, res) => {
  try {
    const { campaign, error } = await findOwnedCampaign(req.params.id, req.user.id);
    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    if (campaign.status !== "draft") {
      return res.status(400).json({
        message: "Only draft campaigns can be published.",
      });
    }

    campaign.status = "published";
    const updatedCampaign = await campaign.save();

    return res.status(200).json({
      message: "Campaign published successfully.",
      campaign: updatedCampaign,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error while publishing campaign." });
  }
};

const closeCampaign = async (req, res) => {
  try {
    const { campaign, error } = await findOwnedCampaign(req.params.id, req.user.id);
    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    if (campaign.status !== "published") {
      return res.status(400).json({
        message: "Only published campaigns can be closed.",
      });
    }

    campaign.status = "closed";
    const updatedCampaign = await campaign.save();

    return res.status(200).json({
      message: "Campaign closed successfully.",
      campaign: updatedCampaign,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error while closing campaign." });
  }
};

const deleteCampaign = async (req, res) => {
  try {
    const { campaign, error } = await findOwnedCampaign(req.params.id, req.user.id);
    if (error) {
      return res.status(error.status).json({ message: error.message });
    }

    const hasAcceptedApplications = await Application.exists({
      campaign: campaign._id,
      status: { $ne: "skipped" },
    });
    if (hasAcceptedApplications) {
      return res.status(400).json({
        message: "Campaign with accepted applications cannot be deleted.",
      });
    }

    await campaign.deleteOne();

    return res.status(200).json({
      message: "Campaign deleted successfully.",
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error while deleting campaign." });
  }
};

const getPublishedCampaigns = async (req, res) => {
  try {
    const now = new Date();
    
    // Auto-close expired campaigns
    await Campaign.updateMany(
      {
        status: "published",
        endDate: { $lt: now },
      },
      { status: "closed" }
    );

    // Fetch only active (non-expired) published campaigns
    const campaigns = await Campaign.find({
      status: "published",
      endDate: { $gte: now },
    })
      .populate("company", "name")
      .sort({ createdAt: -1 });

    return res.status(200).json({ campaigns });
  } catch (error) {
    return res.status(500).json({ message: "Server error while fetching campaigns." });
  }
};

const getPublicStats = async (req, res) => {
  try {
    const now = new Date();
    
    // Auto-close expired campaigns
    await Campaign.updateMany(
      {
        status: "published",
        endDate: { $lt: now },
      },
      { status: "closed" }
    );
    
    const [totalCampaigns, publishedCampaigns, companyCount, influencerCount] =
      await Promise.all([
        Campaign.countDocuments(),
        Campaign.countDocuments({ status: "published", endDate: { $gte: now } }),
        User.countDocuments({ role: "company" }),
        User.countDocuments({ role: "influencer" }),
      ]);

    return res.status(200).json({
      stats: {
        totalCampaigns,
        publishedCampaigns,
        companyCount,
        influencerCount,
      },
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error while fetching public stats." });
  }
};

module.exports = {
  createCampaign,
  updateCampaign,
  getMyCampaigns,
  getCampaignById,
  publishCampaign,
  closeCampaign,
  deleteCampaign,
  getPublishedCampaigns,
  getPublicStats,
};
