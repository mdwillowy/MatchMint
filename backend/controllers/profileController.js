const CompanyProfile = require("../models/CompanyProfile");
const InfluencerProfile = require("../models/InfluencerProfile");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const normalizeStringArray = (value) => {
  // Accepts either array input or comma-separated text input.
  if (Array.isArray(value)) {
    return value
      .map((item) => String(item).trim())
      .filter((item) => item.length > 0);
  }

  if (typeof value === "string") {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }

  return [];
};

const createOrUpdateCompanyProfile = async (req, res) => {
  try {
    if (req.user.role !== "company") {
      return res.status(403).json({ message: "Only company users can access this endpoint." });
    }

    const { companyName, categories, contactEmail, website, description } = req.body;

    if (!companyName || !categories || !contactEmail) {
      return res.status(400).json({
        message: "companyName, categories, and contactEmail are required.",
      });
    }

    // Normalize categories to array
    const normalizedCategories = normalizeStringArray(categories);
    
    if (normalizedCategories.length === 0) {
      return res.status(400).json({
        message: "At least one category is required.",
      });
    }

    if (!emailRegex.test(contactEmail)) {
      return res.status(400).json({ message: "Invalid contactEmail format." });
    }

    const payload = {
      companyName: companyName.trim(),
      categories: normalizedCategories,
      contactEmail: contactEmail.trim().toLowerCase(),
      website: website ? website.trim() : "",
      description: description ? description.trim() : "",
    };

    const existingProfile = await CompanyProfile.findOne({ user: req.user.id });

    if (existingProfile) {
      existingProfile.companyName = payload.companyName;
      existingProfile.categories = payload.categories;
      existingProfile.contactEmail = payload.contactEmail;
      existingProfile.website = payload.website;
      existingProfile.description = payload.description;

      const updatedProfile = await existingProfile.save();

      return res.status(200).json({
        message: "Company profile updated successfully.",
        profile: updatedProfile,
      });
    }

    const newProfile = await CompanyProfile.create({
      user: req.user.id,
      ...payload,
    });

    return res.status(201).json({
      message: "Company profile created successfully.",
      profile: newProfile,
    });
  } catch (error) {
    return res.status(500).json({ message: "Server error while saving company profile." });
  }
};

const getMyCompanyProfile = async (req, res) => {
  try {
    if (req.user.role !== "company") {
      return res.status(403).json({ message: "Only company users can access this endpoint." });
    }

    const profile = await CompanyProfile.findOne({ user: req.user.id });

    if (!profile) {
      return res.status(404).json({ message: "Company profile not found." });
    }

    return res.status(200).json({ profile });
  } catch (error) {
    return res.status(500).json({ message: "Server error while fetching company profile." });
  }
};

const createOrUpdateInfluencerProfile = async (req, res) => {
  try {
    if (req.user.role !== "influencer") {
      return res.status(403).json({ message: "Only influencer users can access this endpoint." });
    }

    const { fullName, niches, platforms, audienceSize, bio } = req.body;

    const normalizedNiches = normalizeStringArray(niches);
    const normalizedPlatforms = normalizeStringArray(platforms);

    if (!fullName) {
      return res.status(400).json({ message: "fullName is required." });
    }

    if (normalizedNiches.length < 1) {
      return res.status(400).json({ message: "At least one niche is required." });
    }

    if (normalizedPlatforms.length < 1) {
      return res.status(400).json({ message: "At least one platform is required." });
    }

    if (audienceSize === undefined || audienceSize === null || audienceSize === "") {
      return res.status(400).json({ message: "audienceSize is required." });
    }

    const audienceSizeNumber = Number(audienceSize);

    if (Number.isNaN(audienceSizeNumber) || audienceSizeNumber < 0) {
      return res.status(400).json({
        message: "audienceSize must be a number greater than or equal to 0.",
      });
    }

    const payload = {
      fullName: fullName.trim(),
      niches: normalizedNiches,
      platforms: normalizedPlatforms,
      audienceSize: audienceSizeNumber,
      bio: bio ? bio.trim() : "",
    };

    const existingProfile = await InfluencerProfile.findOne({ user: req.user.id });

    if (existingProfile) {
      existingProfile.fullName = payload.fullName;
      existingProfile.niches = payload.niches;
      existingProfile.platforms = payload.platforms;
      existingProfile.audienceSize = payload.audienceSize;
      existingProfile.bio = payload.bio;

      const updatedProfile = await existingProfile.save();

      return res.status(200).json({
        message: "Influencer profile updated successfully.",
        profile: updatedProfile,
      });
    }

    const newProfile = await InfluencerProfile.create({
      user: req.user.id,
      ...payload,
    });

    return res.status(201).json({
      message: "Influencer profile created successfully.",
      profile: newProfile,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while saving influencer profile.",
    });
  }
};

const getMyInfluencerProfile = async (req, res) => {
  try {
    if (req.user.role !== "influencer") {
      return res.status(403).json({ message: "Only influencer users can access this endpoint." });
    }

    const profile = await InfluencerProfile.findOne({ user: req.user.id });

    if (!profile) {
      return res.status(404).json({ message: "Influencer profile not found." });
    }

    return res.status(200).json({ profile });
  } catch (error) {
    return res.status(500).json({ message: "Server error while fetching influencer profile." });
  }
};

module.exports = {
  createOrUpdateCompanyProfile,
  getMyCompanyProfile,
  createOrUpdateInfluencerProfile,
  getMyInfluencerProfile,
};
