const sanitizeValue = (value) => {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  if (value && typeof value === "object") {
    return Object.keys(value).reduce((acc, key) => {
      const safeKey = key.replace(/\$/g, "").replace(/\./g, "");
      acc[safeKey] = sanitizeValue(value[key]);
      return acc;
    }, {});
  }

  return value;
};

const sanitizeRequest = (req, res, next) => {
  if (req.body) {
    req.body = sanitizeValue(req.body);
  }

  if (req.query) {
    const sanitizedQuery = sanitizeValue(req.query);
    Object.keys(req.query).forEach((key) => delete req.query[key]);
    Object.assign(req.query, sanitizedQuery);
  }

  if (req.params) {
    const sanitizedParams = sanitizeValue(req.params);
    Object.keys(req.params).forEach((key) => delete req.params[key]);
    Object.assign(req.params, sanitizedParams);
  }

  next();
};

module.exports = sanitizeRequest;
