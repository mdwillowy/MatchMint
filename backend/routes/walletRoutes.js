const express = require("express");
const { protect } = require("../middleware/authMiddleware");
const { getWallet, addMoney } = require("../controllers/walletController");

const router = express.Router();

router.get("/", protect, getWallet);
router.post("/add-money", protect, addMoney);

module.exports = router;
