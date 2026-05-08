const express = require("express");
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const { protect } = require("../middleware/authMiddleware");
const { authorizeRoles } = require("../middleware/roleMiddleware");
const {
  submitProof,
  getMyProofs,
  getProofForApplication,
  updateProofForApplication,
} = require("../controllers/proofController");

const router = express.Router();

const uploadRoot = path.join(__dirname, "..", "uploads", "proofs");
if (!fs.existsSync(uploadRoot)) {
  fs.mkdirSync(uploadRoot, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadRoot),
  filename: (req, file, cb) => {
    const safeName = `${Date.now()}-${file.originalname}`.replace(/\s+/g, "-");
    cb(null, safeName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
});

router.post(
  "/submit",
  protect,
  authorizeRoles("influencer"),
  upload.single("screenshot"),
  submitProof
);
router.put(
  "/application/:applicationId",
  protect,
  authorizeRoles("influencer"),
  upload.single("screenshot"),
  updateProofForApplication
);
router.get("/me", protect, authorizeRoles("influencer"), getMyProofs);
router.get(
  "/application/:applicationId",
  protect,
  authorizeRoles("company"),
  getProofForApplication
);

module.exports = router;
