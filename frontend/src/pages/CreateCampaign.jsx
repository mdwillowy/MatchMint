import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AlertMessage from "../components/AlertMessage";
import LoadingSpinner from "../components/LoadingSpinner";
import { createCampaign } from "../services/campaignService";
import { getErrorMessage, getToken } from "../services/authService";

const CATEGORY_OPTIONS = [
  "E-Commerce",
  "Technology & Software",
  "Gaming",
  "Entertainment",
  "Sports",
  "Fashion & Apparel",
  "Beauty & Cosmetics",
  "Health & Fitness",
  "Food & Beverage",
  "Travel & Tourism",
  "Music",
  "Finance & Investment",
  "Real Estate",
  "Education",
  "Automotive",
  "Home & Living",
  "Jewelry & Accessories",
  "Pets & Animals",
  "Art & Design",
  "Social Impact / Non-profit",
  "Wellness & Mental Health",
  "Skincare & Personal Care",
  "Business Services",
  "Media & Publishing",
  "Other"
];

const PLATFORM_OPTIONS = [
  "Instagram",
  "YouTube",
  "TikTok",
  "Twitter",
  "LinkedIn",
  "Facebook",
  "Twitch",
  "Pinterest",
  "Snapchat"
];

const validateCampaignData = (data) => {
  const {
    title,
    categories,
    platforms,
    budgetMin,
    budgetMax,
    startDate,
    endDate,
  } = data;

  if (!title || !Array.isArray(categories) || categories.length === 0 || categories.length > 3) {
    return "Title and Categories (1-3) are required.";
  }

  if (!platforms || !Array.isArray(platforms) || platforms.length === 0) {
    return "At least one Platform is required.";
  }

  if (budgetMin === "" || budgetMax === "" || !startDate || !endDate) {
    return "Budget and Dates are required.";
  }

  if (String(title).trim().length < 5) {
    return "Title must be at least 5 characters.";
  }

  const min = Number(budgetMin);
  const max = Number(budgetMax);

  if (Number.isNaN(min) || Number.isNaN(max) || min < 0 || max < 0) {
    return "Budget values must be numbers greater than or equal to 0.";
  }

  if (max < min) {
    return "Budget max must be greater than or equal to budget min.";
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (start < today) {
    return "Start date cannot be in the past.";
  }

  if (end < start) {
    return "End date must be greater than or equal to start date.";
  }

  return "";
};

function CreateCampaign() {
  const navigate = useNavigate();
  const token = getToken();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    categories: [],
    platforms: [],
    budgetMin: "",
    budgetMax: "",
    startDate: "",
    endDate: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [saving, setSaving] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryToggle = (category) => {
    setFormData((prev) => {
      const updated = prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category];
      
      return { ...prev, categories: updated.slice(0, 3) };
    });
  };

  const handlePlatformToggle = (platform) => {
    setFormData((prev) => {
      const updated = prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform];
      
      return { ...prev, platforms: updated.slice(0, 3) };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    const validationError = validateCampaignData(formData);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);

    try {
      const payload = {
        ...formData,
        budgetMin: Number(formData.budgetMin),
        budgetMax: Number(formData.budgetMax),
      };

      const response = await createCampaign(payload, token);
      setSuccess(response.message || "Campaign created successfully.");
      setTimeout(() => navigate("/company/campaigns"), 700);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-wrap">
      <form className="card form campaign-form-card" onSubmit={handleSubmit}>
        <h2>Create Campaign</h2>

        <label htmlFor="title">
          Title <span className="required-star">*</span>
        </label>
        <input
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="Campaign title"
          required
        />

        <label htmlFor="description">Description</label>
        <textarea
          id="description"
          name="description"
          rows="4"
          value={formData.description}
          onChange={handleChange}
          placeholder="Campaign description (optional)"
        />

        <label>
          Categories <span className="required-star">*</span>
          <span style={{ color: "#999", fontSize: "12px", fontWeight: "normal" }}> (Select 1 to 3)</span>
        </label>

        {/* Selected Categories Display */}
        {formData.categories.length > 0 ? (
          <div className="selected-categories">
            {formData.categories.map((cat) => (
              <div key={cat} className="category-tag">
                <span>{cat}</span>
                <button
                  type="button"
                  className="category-tag-remove"
                  onClick={() => handleCategoryToggle(cat)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        ) : null}

        {/* Category Checkboxes */}
        <div className="platform-checkboxes">
          {CATEGORY_OPTIONS.map((cat) => (
            <label key={cat} className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.categories.includes(cat)}
                onChange={() => handleCategoryToggle(cat)}
                disabled={
                  formData.categories.length >= 3 &&
                  !formData.categories.includes(cat)
                }
              />
              <span>{cat}</span>
            </label>
          ))}
        </div>

        <label>
          Platforms <span className="required-star">*</span>
          <span style={{ color: "#999", fontSize: "12px", fontWeight: "normal" }}> (Select up to 3)</span>
        </label>

        {/* Selected Platforms Display */}
        {formData.platforms.length > 0 ? (
          <div className="selected-categories">
            {formData.platforms.map((plat) => (
              <div key={plat} className="category-tag">
                <span>{plat}</span>
                <button
                  type="button"
                  className="category-tag-remove"
                  onClick={() => handlePlatformToggle(plat)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        ) : null}

        {/* Platform Checkboxes */}
        <div className="platform-checkboxes">
          {PLATFORM_OPTIONS.map((platform) => (
            <label key={platform} className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.platforms.includes(platform)}
                onChange={() => handlePlatformToggle(platform)}
                disabled={
                  formData.platforms.length >= 3 &&
                  !formData.platforms.includes(platform)
                }
              />
              <span>{platform}</span>
            </label>
          ))}
        </div>

        <div className="campaign-grid-2">
          <div>
            <label htmlFor="budgetMin">
              Budget Min <span className="required-star">*</span>
            </label>
            <input
              id="budgetMin"
              name="budgetMin"
              type="number"
              min="0"
              value={formData.budgetMin}
              onChange={handleChange}
              placeholder="0"
              required
            />
          </div>
          <div>
            <label htmlFor="budgetMax">
              Budget Max <span className="required-star">*</span>
            </label>
            <input
              id="budgetMax"
              name="budgetMax"
              type="number"
              min="0"
              value={formData.budgetMax}
              onChange={handleChange}
              placeholder="0"
              required
            />
          </div>
        </div>

        <div className="campaign-grid-2">
          <div>
            <label htmlFor="startDate">
              Start Date <span className="required-star">*</span>
            </label>
            <input
              id="startDate"
              name="startDate"
              type="date"
              min={new Date().toISOString().split("T")[0]}
              value={formData.startDate}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label htmlFor="endDate">
              End Date <span className="required-star">*</span>
            </label>
            <input
              id="endDate"
              name="endDate"
              type="date"
              min={formData.startDate || new Date().toISOString().split("T")[0]}
              value={formData.endDate}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        <AlertMessage type="error" message={error} />
        <AlertMessage type="success" message={success} />
        {saving ? <LoadingSpinner label="Creating campaign..." /> : null}

        <div className="row gap-sm">
          <button className="btn primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Create Campaign"}
          </button>
          <button
            className="btn ghost"
            type="button"
            onClick={() => navigate("/company/campaigns")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default CreateCampaign;
