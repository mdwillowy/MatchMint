import { Link } from "react-router-dom";

function NotFound() {
  return (
    <div className="page-wrap">
      <div className="card">
        <h2>404 - Page Not Found</h2>
        <p className="muted">
          The page you are looking for does not exist or the link is outdated.
        </p>
        <div className="row gap-sm">
          <Link className="btn primary" to="/">
            Go to Landing Page
          </Link>
          <Link className="btn ghost" to="/login">
            Go to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default NotFound;
