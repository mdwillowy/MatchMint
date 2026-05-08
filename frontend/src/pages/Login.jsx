import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import AlertMessage from "../components/AlertMessage";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  getDashboardPathByRole,
  getErrorMessage,
  loginUser,
  saveAuthData,
} from "../services/authService";

function Login({ onClose, onSwitch }) {
  const navigate = useNavigate();
  const location = useLocation();
  const sessionExpired = new URLSearchParams(location.search).get("session") === "expired";
  const [formData, setFormData] = useState({
    email: "",
    password: "",
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
      const data = await loginUser(formData);
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
          <h2>Login</h2>
          <button
            type="button"
            className="auth-close-btn"
            onClick={onClose}
            aria-label="Close login form"
          >
            ×
          </button>
        </div>

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
          placeholder="Enter your password"
          required
        />

        {sessionExpired ? (
          <AlertMessage
            type="info"
            message="Your session expired. Please log in again."
          />
        ) : null}

        <AlertMessage type="error" message={error} />

        {loading ? <LoadingSpinner label="Validating credentials..." /> : null}

        <button className="btn primary" type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <p className="muted small">
          New user?{" "}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              if (onSwitch) onSwitch("signup");
              else navigate("/signup");
            }}
          >
            Create account
          </a>
        </p>
      </form>
    </div>
  );
}

export default Login;
