const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");
const Wallet = require("../models/Wallet");

dotenv.config();

const getStartingBalance = (role) => {
  return role === "company" ? 50000 : 100;
};

const run = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is required before backfilling wallets.");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const users = await User.find({}, "role email");
  const created = [];
  const alreadyPresent = [];

  for (const user of users) {
    const existingWallet = await Wallet.findOne({ user: user._id });

    if (existingWallet) {
      alreadyPresent.push(user.email);
      continue;
    }

    const wallet = await Wallet.create({
      user: user._id,
      balance: getStartingBalance(user.role),
      transactions: [],
    });

    created.push({ email: user.email, balance: wallet.balance });
  }

  console.log(
    JSON.stringify(
      {
        totalUsers: users.length,
        created,
        alreadyPresent,
      },
      null,
      2
    )
  );

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});