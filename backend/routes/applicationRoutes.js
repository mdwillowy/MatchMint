const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const {
  respondToCampaign,
  getMyApplications,
  getApplicantsForCompanyCampaign,
} = require("../controllers/applicationController");

const router = express.Router();

router.post("/respond", protect, authorizeRoles("influencer"), respondToCampaign);
router.get("/me", protect, authorizeRoles("influencer"), getMyApplications);
router.get(
  "/campaign/:campaignId/applicants",
  protect,
  authorizeRoles("company"),
  getApplicantsForCompanyCampaign
);

module.exports = router;
