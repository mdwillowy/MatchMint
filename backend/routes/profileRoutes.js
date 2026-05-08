const express = require("express");
const {
  createOrUpdateCompanyProfile,
  getMyCompanyProfile,
  createOrUpdateInfluencerProfile,
  getMyInfluencerProfile,
} = require("../controllers/profileController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.post(
  "/company",
  protect,
  authorizeRoles("company"),
  createOrUpdateCompanyProfile
);
router.get(
  "/company/me",
  protect,
  authorizeRoles("company"),
  getMyCompanyProfile
);

router.post(
  "/influencer",
  protect,
  authorizeRoles("influencer"),
  createOrUpdateInfluencerProfile
);
router.get(
  "/influencer/me",
  protect,
  authorizeRoles("influencer"),
  getMyInfluencerProfile
);

module.exports = router;
