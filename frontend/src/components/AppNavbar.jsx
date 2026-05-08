import { Link, useLocation, useNavigate } from "react-router-dom";
import { clearAuthData, getStoredUser, getToken } from "../services/authService";

function AppNavbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = getToken();
  const user = getStoredUser();

  const isAuthPage = ["/", "/login", "/signup"].includes(location.pathname);

  if (!token || !user || isAuthPage) {
    return null;
  }

  const roleLinks =
    user.role === "company"
      ? [
          { to: "/company/campaigns", label: "Campaigns" },
          { to: "/company/profile", label: "Profile" },
          { to: "/payments", label: "Payments" },
        ]
      : [
          { to: "/influencer/applications", label: "Applications" },
          { to: "/influencer/profile", label: "Profile" },
          { to: "/payments", label: "Payments" },
        ];

  const dashboardPath = user.role === "company" ? "/company/dashboard" : "/influencer/dashboard";

  const handleLogout = () => {
    clearAuthData();
    navigate("/");
  };

  return (
    <header className="app-navbar">
      <div className="app-navbar-inner">
        <Link to={dashboardPath} className="app-brand">
          MatchMint
        </Link>

        <div className="app-nav-actions">
          <nav className="app-nav-links" aria-label={`${user.role} navigation`}>
            {roleLinks.map((item) => (
              <Link key={item.to} to={item.to} className="app-nav-link">
                {item.label}
              </Link>
            ))}
          </nav>
          <button className="btn ghost" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>
    </header>
  );
}

export default AppNavbar;
