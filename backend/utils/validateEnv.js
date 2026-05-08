const requiredEnvVars = ["MONGO_URI", "JWT_SECRET", "CLIENT_ORIGIN"];

const validateEnv = () => {
  const missing = requiredEnvVars.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}`
    );
  }
};

module.exports = validateEnv;
