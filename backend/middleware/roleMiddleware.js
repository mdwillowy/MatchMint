const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ message: "Not authorized." });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Allowed role(s): ${roles.join(", ")}.`,
      });
    }

    next();
  };
};

module.exports = { authorizeRoles };
