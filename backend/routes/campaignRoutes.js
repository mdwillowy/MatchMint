const express = require("express");
const {
  createCampaign,
  updateCampaign,
  getMyCampaigns,
  getCampaignById,
  publishCampaign,
  closeCampaign,
  deleteCampaign,
  getPublishedCampaigns,
  getPublicStats,
} = require("../controllers/campaignController");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");

const router = express.Router();

router.get("/public/stats", getPublicStats);
router.get("/public", getPublishedCampaigns);

router.use(protect, authorizeRoles("company"));

router.post("/", createCampaign);
router.put("/:id", updateCampaign);
router.get("/my", getMyCampaigns);
router.get("/:id", getCampaignById);
router.patch("/:id/publish", publishCampaign);
router.patch("/:id/close", closeCampaign);
router.delete("/:id", deleteCampaign);

module.exports = router;
