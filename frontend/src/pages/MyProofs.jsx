import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getErrorMessage, getToken } from "../services/authService";
import { resolveAssetUrl } from "../services/apiClient";
import { getMyProofs } from "../services/proofService";

function MyProofs() {
  const navigate = useNavigate();
  const token = getToken();

  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadProofs = async () => {
      try {
        const data = await getMyProofs(token);
        setProofs(data.proofs || []);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    loadProofs();
  }, [token]);

  const statusClassName = (status) => {
    if (status === "approved") return "status-badge status-success";
    if (status === "rejected") return "status-badge status-rejected";
    return "status-badge status-warning";
  };

  return (
    <div className="page-wrap">
      <div className="card proof-list-card">
        <div className="title-row">
          <h2>My Proofs</h2>
          <button className="btn ghost" onClick={() => navigate("/influencer/dashboard")}>
            Dashboard
          </button>
        </div>

        {loading ? <p className="muted">Loading proofs...</p> : null}
        {error ? <p className="error">{error}</p> : null}

        {!loading && proofs.length === 0 ? (
          <p className="muted">No proofs submitted yet.</p>
        ) : null}

        <div className="proof-list">
          {proofs.map((item) => (
            <div className="proof-item" key={item._id}>
              <div className="proof-item-head">
                <h3>{item?.application?.campaign?.title || "Campaign"}</h3>
                <span className={statusClassName(item.approvalStatus)}>
                  {item.approvalStatus}
                </span>
              </div>

              <p>
                <strong>Profile Link:</strong>{" "}
                <a href={item.proofUrl} target="_blank" rel="noreferrer">
                  Open Link
                </a>
              </p>

              {item.secondaryLink ? (
                <p>
                  <strong>Additional Link:</strong>{" "}
                  <a href={item.secondaryLink} target="_blank" rel="noreferrer">
                    Open Link
                  </a>
                </p>
              ) : null}

              {item.screenshotUrl ? (
                <p>
                  <strong>Screenshot:</strong>{" "}
                  <a href={resolveAssetUrl(item.screenshotUrl)} target="_blank" rel="noreferrer">
                    Open Screenshot
                  </a>
                </p>
              ) : null}

              {item.notes ? (
                <p>
                  <strong>Notes:</strong> {item.notes}
                </p>
              ) : null}

              {item.phone ? (
                <p>
                  <strong>Phone:</strong> {item.phone}
                </p>
              ) : null}

              {item.reviewNotes ? (
                <p>
                  <strong>Review Notes:</strong> {item.reviewNotes}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MyProofs;
