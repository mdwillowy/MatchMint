const Application = require("../models/Application");
const Campaign = require("../models/Campaign");
const InfluencerProfile = require("../models/InfluencerProfile");
const { calculateMatchScore } = require("../utils/matching");

const getMatchedCampaignsForInfluencer = async (req, res) => {
  try {
    const influencerProfile = await InfluencerProfile.findOne({ user: req.user.id });

    if (!influencerProfile) {
      return res.status(400).json({
        message: "Complete your influencer profile first to get matched campaigns.",
      });
    }

    const existingApplications = await Application.find({ influencer: req.user.id }).select(
      "campaign"
    );
    const appliedCampaignIds = existingApplications.map((item) => item.campaign);

    const publishedCampaigns = await Campaign.find({
      status: "published",
      _id: { $nin: appliedCampaignIds },
    }).sort({ createdAt: -1 });

    const matchedCampaigns = publishedCampaigns
      .map((campaign) => {
        const matchScore = calculateMatchScore(campaign, influencerProfile);
        return {
          campaign,
          matchScore,
        };
      })
      .filter((item) => item.matchScore >= 40)
      .sort((a, b) => b.matchScore - a.matchScore);

    return res.status(200).json({
      campaigns: matchedCampaigns,
      total: matchedCampaigns.length,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while fetching matched campaigns.",
    });
  }
};

const getRankedInfluencersForCompany = async (req, res) => {
  try {
    const companyCampaigns = await Campaign.find({
      company: req.user.id,
      status: "published",
    }).sort({ createdAt: -1 });

    if (companyCampaigns.length === 0) {
      return res.status(200).json({
        influencers: [],
        total: 0,
        campaignsConsidered: 0,
        message: "Publish at least one campaign to see ranked influencer feed.",
      });
    }

    const influencerProfiles = await InfluencerProfile.find({}).populate(
      "user",
      "name email role"
    );

    const rankedInfluencers = influencerProfiles
      .map((profile) => {
        const bestFit = companyCampaigns.reduce(
          (best, campaign) => {
            const score = calculateMatchScore(campaign, profile);
            if (score > best.matchScore) {
              return {
                matchScore: score,
                campaign,
              };
            }

            return best;
          },
          {
            matchScore: 0,
            campaign: null,
          }
        );

        return {
          influencer: {
            id: profile?.user?._id,
            name: profile?.user?.name || profile.fullName,
            email: profile?.user?.email || "",
            fullName: profile.fullName,
            niches: profile.niches,
            platforms: profile.platforms,
            audienceSize: profile.audienceSize,
            bio: profile.bio,
          },
          matchScore: bestFit.matchScore,
          bestCampaign: bestFit.campaign
            ? {
                id: bestFit.campaign._id,
                title: bestFit.campaign.title,
                category: bestFit.campaign.category,
                platforms: bestFit.campaign.platforms || (bestFit.campaign.platform ? [bestFit.campaign.platform] : []),
              }
            : null,
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);

    return res.status(200).json({
      influencers: rankedInfluencers,
      total: rankedInfluencers.length,
      campaignsConsidered: companyCampaigns.length,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while fetching company influencer feed.",
    });
  }
};

module.exports = {
  getMatchedCampaignsForInfluencer,
  getRankedInfluencersForCompany,
};
