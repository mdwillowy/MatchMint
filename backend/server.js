const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const path = require("path"); // <-- Imported here (only once)
const connectDB = require("./config/db");
const validateEnv = require("./utils/validateEnv");
const sanitizeRequest = require("./middleware/sanitizeMiddleware");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const campaignRoutes = require("./routes/campaignRoutes");
const matchRoutes = require("./routes/matchRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const proofRoutes = require("./routes/proofRoutes");
const reviewPaymentRoutes = require("./routes/reviewPaymentRoutes");
const walletRoutes = require("./routes/walletRoutes");

dotenv.config();
validateEnv();
connectDB();

const app = express();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many auth attempts. Please try again later.",
    data: null,
  },
});

app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN,
    credentials: true,
  })
);
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(sanitizeRequest);

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/campaigns", campaignRoutes);
app.use("/api/matches", matchRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/proofs", proofRoutes);
app.use("/api/review-payment", reviewPaymentRoutes);
app.use("/api/wallet", walletRoutes);

app.get("/api/health", (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Health check OK",
    data: {
      status: "up",
      timestamp: new Date().toISOString(),
    },
  });
});

// --- REACT FRONTEND SERVING CODE GOES HERE ---
// 1. Serve static files from the Vite 'dist' folder
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// 2. Catch-all route: Send all other requests to the React index.html
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// --- ERROR HANDLERS MUST BE AT THE VERY BOTTOM ---
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5090;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));