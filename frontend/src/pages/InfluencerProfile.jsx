import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getErrorMessage, getToken } from "../services/authService";
import {
  getMyInfluencerProfile,
  saveInfluencerProfile,
} from "../services/profileService";

const NICHE_OPTIONS = [
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
  "Snapchat",
  "Other"
];

function InfluencerProfile() {
  const navigate = useNavigate();
  const token = getToken();

  const [formData, setFormData] = useState({
    fullName: "",
    niches: [],
    platforms: [],
    audienceSize: "",
    bio: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [nicheDropdownOpen, setNicheDropdownOpen] = useState(false);
  const [nicheSearch, setNicheSearch] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getMyInfluencerProfile(token);
        if (data?.profile) {
          setFormData({
            fullName: data.profile.fullName || "",
            niches: data.profile.niches || [],
            platforms: data.profile.platforms || [],
            audienceSize: data.profile.audienceSize ?? "",
            bio: data.profile.bio || "",
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

  const handleNicheToggle = (niche) => {
    setFormData((prev) => ({
      ...prev,
      niches: prev.niches.includes(niche)
        ? prev.niches.filter((n) => n !== niche)
        : prev.niches.length >= 5
          ? prev.niches
          : [...prev.niches, niche],
    }));
  };

  const handlePlatformToggle = (platform) => {
    setFormData((prev) => ({
      ...prev,
      platforms: prev.platforms.includes(platform)
        ? prev.platforms.filter((p) => p !== platform)
        : [...prev.platforms, platform],
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const data = await saveInfluencerProfile(
        {
          ...formData,
          audienceSize: Number(formData.audienceSize),
        },
        token
      );
      setSuccess(data.message || "Profile saved successfully.");

      setTimeout(() => navigate("/influencer/dashboard"), 700);
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

        <label htmlFor="fullName">
          Full Name <span className="required-star">*</span>
        </label>
        <input
          id="fullName"
          name="fullName"
          value={formData.fullName}
          onChange={handleChange}
          required
        />

        <label>
          Niches <span className="required-star">*</span>
          <span className="field-hint">(Select up to 5)</span>
        </label>
        {formData.niches.length > 0 ? (
          <div className="selected-categories">
            {formData.niches.map((niche) => (
              <div key={niche} className="category-tag">
                <span>{niche}</span>
                <button
                  type="button"
                  className="category-tag-remove"
                  onClick={() => handleNicheToggle(niche)}
                >
                  x
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <div className="category-dropdown-wrapper">
          <button
            type="button"
            className="category-dropdown-btn"
            onClick={() => setNicheDropdownOpen((prev) => !prev)}
          >
            {nicheDropdownOpen ? "Hide niches" : "Select niches"}
            <span className="dropdown-arrow">{nicheDropdownOpen ? "▲" : "▼"}</span>
          </button>

          {nicheDropdownOpen ? (
            <div className="category-dropdown-menu">
              <div className="category-search-wrapper">
                <input
                  type="text"
                  className="category-search-input"
                  placeholder="Search niches..."
                  value={nicheSearch}
                  onChange={(event) => setNicheSearch(event.target.value.toLowerCase())}
                />
              </div>
              {NICHE_OPTIONS.filter((niche) =>
                niche.toLowerCase().includes(nicheSearch)
              ).map((niche) => (
                <label key={niche} className="dropdown-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.niches.includes(niche)}
                    onChange={() => handleNicheToggle(niche)}
                    disabled={
                      formData.niches.length >= 5 &&
                      !formData.niches.includes(niche)
                    }
                  />
                  <span>{niche}</span>
                </label>
              ))}
            </div>
          ) : null}
        </div>

        <label>
          Platforms <span className="required-star">*</span>
          <span className="field-hint">(Select at least 1)</span>
        </label>
        <div className="category-checkboxes">
          {PLATFORM_OPTIONS.map((platform) => (
            <label key={platform} className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.platforms.includes(platform)}
                onChange={() => handlePlatformToggle(platform)}
              />
              <span>{platform}</span>
            </label>
          ))}
        </div>

        <label htmlFor="audienceSize">
          Audience Size <span className="required-star">*</span>
        </label>
        <input
          id="audienceSize"
          name="audienceSize"
          type="number"
          min="0"
          value={formData.audienceSize}
          onChange={handleChange}
          required
        />

        <label htmlFor="bio">
          Bio <span className="optional-text">Optional</span>
        </label>
        <textarea
          id="bio"
          name="bio"
          rows="4"
          value={formData.bio}
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
            onClick={() => navigate("/influencer/dashboard")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default InfluencerProfile;
