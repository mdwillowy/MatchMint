const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const {
  reviewProof,
  markReadyForPayment,
  markAsPaidSimulated,
  rejectPaymentByCompany,
  markCompleted,
  submitReadyForPaymentByInfluencer,
  getCompanyPipelineStats,
  getInfluencerPipelineStats,
} = require("../controllers/reviewPaymentController");

const router = express.Router();

router.patch("/review", protect, authorizeRoles("company"), reviewProof);
router.patch("/ready", protect, authorizeRoles("company"), markReadyForPayment);
router.patch("/paid", protect, authorizeRoles("company"), markAsPaidSimulated);
router.patch(
  "/paid/reject",
  protect,
  authorizeRoles("company"),
  rejectPaymentByCompany
);
router.patch(
  "/complete",
  protect,
  authorizeRoles("company", "influencer"),
  markCompleted
);
router.patch(
  "/ready-for-payment/:applicationId",
  protect,
  authorizeRoles("influencer"),
  submitReadyForPaymentByInfluencer
);
router.get(
  "/company/stats",
  protect,
  authorizeRoles("company"),
  getCompanyPipelineStats
);
router.get(
  "/influencer/stats",
  protect,
  authorizeRoles("influencer"),
  getInfluencerPipelineStats
);

module.exports = router;
