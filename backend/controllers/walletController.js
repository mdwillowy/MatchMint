const User = require("../models/User");
const Wallet = require("../models/Wallet");
const Transaction = require("../models/Transaction");

const getInitialBalanceForUser = async (userId) => {
  const user = await User.findById(userId).select("role");

  if (!user) {
    return 0;
  }

  return user.role === "company" ? 50000 : 100;
};

const ensureWalletForUser = async (userId) => {
  let wallet = await Wallet.findOne({ user: userId });

  if (wallet) {
    return wallet;
  }

  const initialBalance = await getInitialBalanceForUser(userId);
  wallet = await Wallet.create({
    user: userId,
    balance: initialBalance,
    transactions: [],
  });

  return wallet;
};

const getWallet = async (req, res) => {
  try {
    const userId = req.user.id;

    const wallet = await ensureWalletForUser(userId);
    const populatedWallet = await Wallet.findById(wallet._id).populate({
      path: "transactions",
      options: { sort: { createdAt: -1 }, limit: 50 },
    });

    return res.status(200).json({
      message: "Wallet retrieved successfully.",
      wallet: populatedWallet,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while fetching wallet.",
    });
  }
};

const addMoney = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        message: "Amount must be greater than 0.",
      });
    }

    const wallet = await ensureWalletForUser(userId);

    const balanceBefore = wallet.balance;
    wallet.balance += amount;

    const transaction = await Transaction.create({
      wallet: wallet._id,
      user: userId,
      type: "add_money",
      amount,
      description: `Demo money added: ₹${amount}`,
      balanceBefore,
      balanceAfter: wallet.balance,
    });

    wallet.transactions.push(transaction._id);
    await wallet.save();

    return res.status(200).json({
      message: "Money added to wallet successfully.",
      wallet,
      transaction,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Server error while adding money.",
    });
  }
};

const initializeWallet = async (userId, initialBalance = 0) => {
  try {
    const existingWallet = await Wallet.findOne({ user: userId });

    if (existingWallet) {
      return existingWallet;
    }

    const wallet = await Wallet.create({
      user: userId,
      balance: initialBalance,
      transactions: [],
    });

    return wallet;
  } catch (error) {
    console.error("Error initializing wallet:", error);
    return null;
  }
};

const updateWalletBalance = async (
  walletId,
  amount,
  type,
  description,
  applicationId = null
) => {
  try {
    const wallet = await Wallet.findById(walletId);

    if (!wallet) {
      throw new Error("Wallet not found");
    }

    const balanceBefore = wallet.balance;

    if (type === "credit") {
      wallet.balance += amount;
    } else if (type === "debit") {
      if (wallet.balance < amount) {
        throw new Error("Insufficient balance");
      }
      wallet.balance -= amount;
    }

    const transaction = await Transaction.create({
      wallet: wallet._id,
      user: wallet.user,
      type,
      amount,
      description,
      application: applicationId,
      balanceBefore,
      balanceAfter: wallet.balance,
    });

    wallet.transactions.push(transaction._id);
    await wallet.save();

    return { wallet, transaction };
  } catch (error) {
    console.error("Error updating wallet balance:", error);
    throw error;
  }
};

module.exports = {
  getWallet,
  addMoney,
  initializeWallet,
  updateWalletBalance,
  ensureWalletForUser,
};
