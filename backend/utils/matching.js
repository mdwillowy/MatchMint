const normalizeText = (value) => String(value || "").trim().toLowerCase();

const getAudienceRangeFromBudget = (budgetMax) => {
  if (budgetMax <= 10000) {
    return { min: 1000, max: 20000 };
  }

  if (budgetMax <= 50000) {
    return { min: 10000, max: 100000 };
  }

  return { min: 50000, max: 500000 };
};

const getAudienceScore = (audienceSize, range) => {
  const audience = Number(audienceSize);

  if (Number.isNaN(audience) || audience < 0) {
    return 20;
  }

  if (audience >= range.min && audience <= range.max) {
    return 100;
  }

  let distanceRatio = 0;

  if (audience < range.min) {
    distanceRatio = (range.min - audience) / range.min;
  } else {
    distanceRatio = (audience - range.max) / range.max;
  }

  const scaled = 100 - distanceRatio * 80;
  return Math.max(20, Math.min(100, Math.round(scaled)));
};

const calculateMatchScore = (campaign, influencerProfile) => {
  // Handle both old single category and new categories array
  const campaignCategories = Array.isArray(campaign.category)
    ? campaign.category.map(normalizeText)
    : (campaign.category ? [normalizeText(campaign.category)] : []);

  const campaignPlatforms = Array.isArray(campaign.platforms)
    ? campaign.platforms.map(normalizeText)
    : (campaign.platform ? [normalizeText(campaign.platform)] : []);

  const niches = Array.isArray(influencerProfile.niches)
    ? influencerProfile.niches.map(normalizeText)
    : [];
  const platforms = Array.isArray(influencerProfile.platforms)
    ? influencerProfile.platforms.map(normalizeText)
    : [];

  // Check if ANY campaign category matches ANY influencer niche
  const categoryScore = campaignCategories.some((cat) => niches.includes(cat)) ? 100 : 0;
  
  // Check if any of the campaign platforms match influencer platforms
  const platformScore = platforms.some((p) => campaignPlatforms.includes(p)) ? 100 : 0;

  const audienceRange = getAudienceRangeFromBudget(Number(campaign.budgetMax));
  const audienceScore = getAudienceScore(influencerProfile.audienceSize, audienceRange);

  const budgetMin = Number(campaign.budgetMin);
  const budgetMax = Number(campaign.budgetMax);
  const budgetScore =
    !Number.isNaN(budgetMin) &&
    !Number.isNaN(budgetMax) &&
    budgetMin >= 0 &&
    budgetMax >= budgetMin
      ? 100
      : 0;

  const ratingScore = 50;

  const weightedScore =
    0.3 * categoryScore +
    0.25 * platformScore +
    0.2 * audienceScore +
    0.15 * budgetScore +
    0.1 * ratingScore;

  return Math.max(0, Math.min(100, Math.round(weightedScore)));
};

module.exports = { calculateMatchScore };
