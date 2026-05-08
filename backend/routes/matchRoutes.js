const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const {
  getMatchedCampaignsForInfluencer,
  getRankedInfluencersForCompany,
} = require("../controllers/matchController");

const router = express.Router();

router.get(
  "/influencer-feed",
  protect,
  authorizeRoles("influencer"),
  getMatchedCampaignsForInfluencer
);

router.get(
  "/company-feed",
  protect,
  authorizeRoles("company"),
  getRankedInfluencersForCompany
);

module.exports = router;
