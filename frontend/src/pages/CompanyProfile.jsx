import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getErrorMessage, getToken } from "../services/authService";
import {
  getMyCompanyProfile,
  saveCompanyProfile,
} from "../services/profileService";

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

function CompanyProfile() {
  const navigate = useNavigate();
  const token = getToken();

  const [formData, setFormData] = useState({
    companyName: "",
    contactEmail: "",
    categories: [],
    website: "",
    description: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getMyCompanyProfile(token);
        if (data?.profile) {
          setFormData({
            companyName: data.profile.companyName || "",
            contactEmail: data.profile.contactEmail || "",
            categories: data.profile.categories || (data.profile.category ? [data.profile.category] : []),
            website: data.profile.website || "",
            description: data.profile.description || "",
          });
        }
      } catch (err) {
        if (err?.response?.status !== 404) {
          setError(getErrorMessage(err));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [token]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (category) => {
    setFormData((prev) => {
      const updated = prev.categories.includes(category)
        ? prev.categories.filter((c) => c !== category)
        : [...prev.categories, category];
      
      // Limit to 3 categories
      return { ...prev, categories: updated.slice(0, 3) };
    });
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const data = await saveCompanyProfile(formData, token);
      setSuccess(data.message || "Profile saved successfully.");

      setTimeout(() => navigate("/company/dashboard"), 700);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="page-wrap">
        <div className="card">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="page-wrap">
      <form className="card form profile-card" onSubmit={handleSubmit}>
        <h2>Edit Profile</h2>
        <p className="required-note">
          Fields marked <span className="required-star">*</span> are required.
        </p>

        <label htmlFor="companyName">
          Company Name <span className="required-star">*</span>
        </label>
        <input
          id="companyName"
          name="companyName"
          value={formData.companyName}
          onChange={handleChange}
          required
        />

        <label htmlFor="contactEmail">
          Contact Email <span className="required-star">*</span>
        </label>
        <input
          id="contactEmail"
          name="contactEmail"
          type="email"
          value={formData.contactEmail}
          onChange={handleChange}
          required
        />

        <label>
          Business Categories <span className="required-star">*</span>
          <span className="field-hint">(Select up to 3)</span>
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
                  onClick={() => handleCategoryChange(cat)}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        ) : null}

        {/* Dropdown Menu */}
        <div className="category-dropdown-wrapper">
          <button
            type="button"
            className="category-dropdown-btn"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            {dropdownOpen ? "Hide Categories" : "Select Categories"}
            <span className="dropdown-arrow">{dropdownOpen ? "▲" : "▼"}</span>
          </button>

          {dropdownOpen ? (
            <div className="category-dropdown-menu">
              {/* Search Bar */}
              <div className="category-search-wrapper">
                <input
                  type="text"
                  className="category-search-input"
                  placeholder="Search categories..."
                  value={categorySearch}
                  onChange={(e) => setCategorySearch(e.target.value.toLowerCase())}
                />
              </div>

              {/* Filtered Categories */}
              {CATEGORY_OPTIONS.filter((cat) =>
                cat.toLowerCase().includes(categorySearch)
              ).map((cat) => (
                <label key={cat} className="dropdown-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.categories.includes(cat)}
                    onChange={() => handleCategoryChange(cat)}
                    disabled={
                      formData.categories.length >= 3 &&
                      !formData.categories.includes(cat)
                    }
                  />
                  <span>{cat}</span>
                </label>
              ))}
            </div>
          ) : null}
        </div>

        <label htmlFor="website">
          Website <span className="optional-text">Optional</span>
        </label>
        <input
          id="website"
          name="website"
          value={formData.website}
          onChange={handleChange}
        />

        <label htmlFor="description">
          Description <span className="optional-text">Optional</span>
        </label>
        <textarea
          id="description"
          name="description"
          rows="4"
          value={formData.description}
          onChange={handleChange}
        />

        {error ? <p className="error">{error}</p> : null}
        {success ? <p className="success">{success}</p> : null}

        <div className="row gap-sm">
          <button className="btn primary" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save Profile"}
          </button>
          <button
            className="btn ghost"
            type="button"
            onClick={() => navigate("/company/dashboard")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default CompanyProfile;
