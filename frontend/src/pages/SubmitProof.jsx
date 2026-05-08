import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getErrorMessage, getToken } from "../services/authService";
import { submitProof } from "../services/proofService";

function SubmitProof() {
  const navigate = useNavigate();
  const { applicationId } = useParams();
  const token = getToken();

  const [formData, setFormData] = useState({
    profileLink: "",
    secondaryLink: "",
    screenshot: null,
    phone: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!formData.profileLink.trim()) {
      setError("Profile link is required.");
      return;
    }

    if (!formData.notes.trim()) {
      setError("Notes are required.");
      return;
    }

    if (!formData.screenshot) {
      setError("Screenshot is required.");
      return;
    }

    if (formData.screenshot && formData.screenshot.size > 2 * 1024 * 1024) {
      setError("Screenshot must be 2MB or smaller.");
      return;
    }

    setSaving(true);

    try {
      const payload = new FormData();
      payload.append("applicationId", applicationId);
      payload.append("profileLink", formData.profileLink.trim());
      if (formData.secondaryLink.trim()) {
        payload.append("secondaryLink", formData.secondaryLink.trim());
      }
      if (formData.screenshot) {
        payload.append("screenshot", formData.screenshot);
      }
      if (formData.phone.trim()) {
        payload.append("phone", formData.phone.trim());
      }
      if (formData.notes.trim()) {
        payload.append("notes", formData.notes.trim());
      }

      const data = await submitProof(payload, token);
      setSuccess(data.message || "Proof submitted successfully.");
      setTimeout(() => navigate("/influencer/applications"), 700);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-wrap">
      <form className="card form proof-card" onSubmit={handleSubmit}>
        <h2>Submit Proof</h2>
        <p className="required-note">
          Fields marked <span className="required-star">*</span> are required.
        </p>

        <label htmlFor="profileLink">
          Profile Link <span className="required-star">*</span>
        </label>
        <input
          id="profileLink"
          name="profileLink"
          value={formData.profileLink}
          onChange={handleChange}
          placeholder="https://instagram.com/your-profile"
          required
        />

        <label htmlFor="secondaryLink">Additional Link</label>
        <input
          id="secondaryLink"
          name="secondaryLink"
          value={formData.secondaryLink}
          onChange={handleChange}
          placeholder="https://youtube.com/your-channel"
        />

        <label htmlFor="screenshot">
          Screenshot <span className="required-star">*</span>
          <span className="field-hint">(Max 2MB)</span>
        </label>
        <input
          id="screenshot"
          name="screenshot"
          type="file"
          accept="image/*"
          onChange={(event) =>
            setFormData((prev) => ({
              ...prev,
              screenshot: event.target.files?.[0] || null,
            }))
          }
          required
        />

        <label htmlFor="phone">
          Phone <span className="optional-text">Optional</span>
        </label>
        <input
          id="phone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
          placeholder="+1 555 000 0000"
        />

        <label htmlFor="notes">
          Notes <span className="required-star">*</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows="4"
          value={formData.notes}
          onChange={handleChange}
          required
        />

        {error ? <p className="error">{error}</p> : null}
        {success ? <p className="success">{success}</p> : null}

        <div className="row gap-sm">
          <button className="btn primary" type="submit" disabled={saving}>
            {saving ? "Submitting..." : "Submit Proof"}
          </button>
          <button
            className="btn ghost"
            type="button"
            onClick={() => navigate("/influencer/applications")}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default SubmitProof;
