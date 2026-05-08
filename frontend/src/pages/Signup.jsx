import { useState } from "react";
import { useNavigate } from "react-router-dom";
import AlertMessage from "../components/AlertMessage";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  getDashboardPathByRole,
  getErrorMessage,
  saveAuthData,
  signupUser,
} from "../services/authService";

function Signup({ onClose, onSwitch }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "company",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const data = await signupUser(formData);
      saveAuthData(data.token, data.user);
      navigate(getDashboardPathByRole(data.user.role));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrap">
      <form className="card form" onSubmit={handleSubmit}>
        <div className="auth-form-header">
          <h2>Sign Up</h2>
          <button
            type="button"
            className="auth-close-btn"
            onClick={onClose}
            aria-label="Close sign up form"
          >
            ×
          </button>
        </div>

        <label htmlFor="name">Name</label>
        <input
          id="name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          placeholder="Enter your name"
          required
        />

        <label htmlFor="email">Email</label>
        <input
          id="email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="you@example.com"
          required
        />

        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          placeholder="Minimum 6 characters"
          required
        />

        <label htmlFor="role">Role</label>
        <select id="role" name="role" value={formData.role} onChange={handleChange}>
          <option value="company">Company</option>
          <option value="influencer">Influencer</option>
        </select>

        <AlertMessage type="error" message={error} />

        {loading ? <LoadingSpinner label="Creating account..." /> : null}

        <button className="btn primary" type="submit" disabled={loading}>
          {loading ? "Creating account..." : "Sign Up"}
        </button>

        <p className="muted small">
          Already have an account?{" "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (onSwitch) onSwitch("login");
              else navigate("/login");
            }}
          >
            Login
          </a>
        </p>
      </form>
    </div>
  );
}

export default Signup;
