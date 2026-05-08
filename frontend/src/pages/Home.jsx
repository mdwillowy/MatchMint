import { Link, useNavigate } from "react-router-dom";
import heroIllustration from "../assets/undraw_tree.svg";
import {
  clearAuthData,
  getDashboardPathByRole,
  getStoredUser,
  getToken,
} from "../services/authService";

import { useState } from "react";
import Login from "./Login";
import Signup from "./Signup";
import Modal from "../components/Modal";

function Home() {
  const navigate = useNavigate();
  const token = getToken();
  const user = getStoredUser();
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);

  const handleLogout = () => {
    clearAuthData();
    navigate("/");
  };

  return (
    <div className="landing-wrap">
      <header className="landing-nav">
        <div className="landing-logo">MatchMint</div>
        <div className="landing-nav-links">
          {!token || !user ? (
            <>
              <button className="landing-link" onClick={() => setShowLogin(true)}>Sign in</button>
              <button className="landing-pill" onClick={() => setShowSignup(true)}>
                Get started
              </button>
            </>
          ) : (
            <>
              <button className="btn ghost" onClick={handleLogout}>
                Logout
              </button>
            </>
          )}
        </div>
      </header>

      <main className="landing-hero">
        <div className="landing-content">
          <h1>Ultimate connections for brands and creators</h1>
          <p>
            A simple place where companies and influencers create profiles,
            discover each other, and collaborate effectively.
          </p>

          {!token || !user ? (
            <div className="row gap-sm">
              <button className="btn primary" onClick={() => setShowSignup(true)}>
                Start New
              </button>
              <button className="btn ghost" onClick={() => setShowLogin(true)}>
                Welcome Back
              </button>
            </div>
          ) : (
            <div className="stack-sm">
              <p>
                Logged in as <strong>{user.name}</strong> ({user.role})
              </p>
              <div className="row gap-sm">
                <button
                  className="btn primary"
                  onClick={() => navigate(getDashboardPathByRole(user.role))}
                >
                  Dashboard
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="landing-art" aria-hidden="true">
          <img
            src={heroIllustration}
            alt=""
            className="landing-art-image"
          />
        </div>
      </main>

      <footer className="landing-footer">
        <span>Read</span>
        <span>Build</span>
        <span>Collaborate</span>
        <span>Grow</span>
      </footer>
      {showLogin ? (
        <Modal onClose={() => setShowLogin(false)}>
          <Login
            onClose={() => setShowLogin(false)}
            onSwitch={() => {
              setShowLogin(false);
              setShowSignup(true);
            }}
          />
        </Modal>
      ) : null}

      {showSignup ? (
        <Modal onClose={() => setShowSignup(false)}>
          <Signup
            onClose={() => setShowSignup(false)}
            onSwitch={() => {
              setShowSignup(false);
              setShowLogin(true);
            }}
          />
        </Modal>
      ) : null}
    </div>
  );
}

export default Home;
