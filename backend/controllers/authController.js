const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { initializeWallet } = require("./walletController");

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const allowedRoles = ["company", "influencer"];

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

const signup = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  if (!name || !email || !password || !role) {
    throw new AppError("All fields are required.", 400);
  }

  if (!emailRegex.test(email)) {
    throw new AppError("Invalid email format.", 400);
  }

  if (password.length < 6) {
    throw new AppError("Password must be at least 6 characters.", 400);
  }

  if (!allowedRoles.includes(role)) {
    throw new AppError("Role must be either company or influencer.", 400);
  }

  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    throw new AppError("User already exists with this email.", 400);
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    role,
  });

  // Initialize wallet with starting balance based on role
  const startingBalance = role === "company" ? 50000 : 100;
  await initializeWallet(user._id, startingBalance);

  const token = generateToken(user);
  const userPayload = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  return res.status(201).json({
    success: true,
    message: "Signup successful.",
    data: {
      token,
      user: userPayload,
    },
    token,
    user: userPayload,
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError("Email and password are required.", 400);
  }

  if (!emailRegex.test(email)) {
    throw new AppError("Invalid email format.", 400);
  }

  const user = await User.findOne({ email: email.toLowerCase() }).select("+password");

  if (!user) {
    throw new AppError("Invalid email or password.", 401);
  }

  const isPasswordMatch = await bcrypt.compare(password, user.password);

  if (!isPasswordMatch) {
    throw new AppError("Invalid email or password.", 401);
  }

  const token = generateToken(user);
  const userPayload = {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  return res.status(200).json({
    success: true,
    message: "Login successful.",
    data: {
      token,
      user: userPayload,
    },
    token,
    user: userPayload,
  });
});

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");

  if (!user) {
    throw new AppError("User not found.", 404);
  }

  return res.status(200).json({
    success: true,
    message: "User fetched successfully.",
    data: { user },
    user,
  });
});

module.exports = { signup, login, getMe };
