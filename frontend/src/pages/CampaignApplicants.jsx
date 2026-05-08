import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getErrorMessage, getToken } from "../services/authService";
import { getApplicantsForCampaign } from "../services/applicationService";
import { getProofForApplication } from "../services/proofService";
import { resolveAssetUrl } from "../services/apiClient";
import { reviewProof } from "../services/reviewPaymentService";

function CampaignApplicants() {
  const navigate = useNavigate();
  const { id } = useParams();
  const token = getToken();

  const [campaign, setCampaign] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [proofsByApplication, setProofsByApplication] = useState({});
  const [expandedProofId, setExpandedProofId] = useState(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState("");

  const loadApplicants = useCallback(async () => {
    try {
      const data = await getApplicantsForCampaign(id, token);
      setCampaign(data.campaign || null);
      setApplicants(data.applicants || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [id, token]);

  useEffect(() => {
    loadApplicants();
  }, [loadApplicants]);

  const statusClassName = (status) => {
    if (status === "accepted") return "status-badge status-info";
    if (status === "proof_submitted") return "status-badge status-warning";
    if (status === "approved") return "status-badge status-approved";
    if (status === "rejected") return "status-badge status-rejected";
    if (status === "ready_for_payment") return "status-badge status-ready";
    if (status === "paid_simulated") return "status-badge status-success";
    if (status === "completed") return "status-badge status-completed";
    if (status === "skipped") return "status-badge status-muted";
    return "status-badge status-muted";
  };

  const approvalClassName = (status) => {
    if (status === "approved") return "status-badge status-approved";
    if (status === "rejected") return "status-badge status-rejected";
    return "status-badge status-warning";
  };

  const formatStatusLabel = (status) => {
    if (!status) return "Pending";
    return String(status)
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const handleToggleProof = async (applicationId) => {
    if (expandedProofId === applicationId) {
      setExpandedProofId(null);
      return;
    }

    setReviewSuccess("");
    setError("");
    setReviewNotes("");
    setExpandedProofId(applicationId);

    if (!proofsByApplication[applicationId]) {
      try {
        const data = await getProofForApplication(applicationId, token);
        setProofsByApplication((prev) => ({
          ...prev,
          [applicationId]: data.proof,
        }));
      } catch (err) {
        setError(getErrorMessage(err));
      }
    }
  };

  const handleReview = async (applicationId, decision) => {
    setReviewSaving(true);
    setError("");
    setReviewSuccess("");

    try {
      const data = await reviewProof(
        { applicationId, decision, reviewNotes },
        token
      );
      setReviewSuccess(data.message || "Review submitted.");
      await loadApplicants();
      const proofData = await getProofForApplication(applicationId, token);
      setProofsByApplication((prev) => ({
        ...prev,
        [applicationId]: proofData.proof,
      }));
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setReviewSaving(false);
    }
  };

  return (
    <div className="page-wrap">
      <div className="card matching-card">
        <div className="title-row">
          <h2>Campaign Applicants</h2>
          <button
            className="btn ghost"
            onClick={() => navigate("/company/campaigns")}
          >
            Back to Campaigns
          </button>
        </div>

        {campaign ? (
          <p className="muted">
            <strong>{campaign.title}</strong> ({campaign.status})
          </p>
        ) : null}

        {loading ? <p className="muted">Loading applicants...</p> : null}
        {error ? <p className="error">{error}</p> : null}

        {!loading && applicants.length === 0 ? (
          <p className="muted">No applicants yet for this campaign.</p>
        ) : null}

        <div className="matching-list">
          {applicants.map((item) => (
            <div className="matching-item" key={item._id}>
              <div className="matching-item-head">
                <h3>{item?.influencer?.name || "Unknown Influencer"}</h3>
                <div className="row gap-sm">
                  <span className={statusClassName(item.status)}>{formatStatusLabel(item.status)}</span>
                  <span className="score-badge score-medium">
                    Match {item.matchScore}
                  </span>
                </div>
              </div>

              <div className="matching-meta">
                <span>Email: {item?.influencer?.email || "-"}</span>
                <span>Role: {item?.influencer?.role || "-"}</span>
                <span>
                  Responded: {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>

              {["accepted", "proof_submitted", "approved", "ready_for_payment"].includes(
                item.status
              ) ? (
                <div className="matching-review">
                  <div className="matching-review-head">
                    <span className="matching-review-title">Proof Review</span>
                    {proofsByApplication[item._id]?.approvalStatus === "approved" ? (
                      <span className={approvalClassName("approved")}>Proof: Approved</span>
                    ) : null}
                    {proofsByApplication[item._id]?.approvalStatus === "rejected" ? (
                      <span className={approvalClassName("rejected")}>Proof: Rejected</span>
                    ) : null}
                    {!proofsByApplication[item._id]?.approvalStatus ? (
                      <span className={approvalClassName("pending")}>Proof: Pending</span>
                    ) : null}
                    {!proofsByApplication[item._id] ? (
                      <button
                        className="btn ghost btn-sm"
                        type="button"
                        onClick={() => handleToggleProof(item._id)}
                      >
                        Review Proof
                      </button>
                    ) : null}
                    {proofsByApplication[item._id]?.approvalStatus === "pending" ? (
                      <button
                        className="btn ghost btn-sm"
                        type="button"
                        onClick={() => handleToggleProof(item._id)}
                      >
                        {expandedProofId === item._id ? "Hide" : "Review Proof"}
                      </button>
                    ) : null}
                  </div>

                  {expandedProofId === item._id && proofsByApplication[item._id] ? (
                    <div className="matching-review-body">
                      <div className="matching-review-row">
                        <span className="matching-review-label">Influencer</span>
                        <span>{item?.influencer?.name || "-"}</span>
                      </div>
                      <div className="matching-review-row">
                        <span className="matching-review-label">Role</span>
                        <span>{item?.influencer?.role || "-"}</span>
                      </div>
                      <div className="matching-review-row">
                        <span className="matching-review-label">Application Status</span>
                        <span className={statusClassName(item.status)}>{formatStatusLabel(item.status)}</span>
                      </div>
                      <div className="matching-review-row">
                        <span className="matching-review-label">Proof Approval</span>
                        <span className={approvalClassName(proofsByApplication[item._id].approvalStatus)}>
                          {formatStatusLabel(proofsByApplication[item._id].approvalStatus)}
                        </span>
                      </div>
                      <div className="matching-review-row">
                        <span className="matching-review-label">Profile Link</span>
                        <a
                          className="applicant-proof-link"
                          href={proofsByApplication[item._id].proofUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open Link
                        </a>
                      </div>
                      {proofsByApplication[item._id].secondaryLink ? (
                        <div className="matching-review-row">
                          <span className="matching-review-label">Additional Link</span>
                          <a
                            className="applicant-proof-link"
                            href={proofsByApplication[item._id].secondaryLink}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open Link
                          </a>
                        </div>
                      ) : null}
                      {proofsByApplication[item._id].screenshotUrl ? (
                        <div className="matching-review-row">
                          <span className="matching-review-label">Screenshot</span>
                          <a
                            className="applicant-proof-link"
                            href={resolveAssetUrl(proofsByApplication[item._id].screenshotUrl)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open Screenshot
                          </a>
                        </div>
                      ) : null}
                      {proofsByApplication[item._id].notes ? (
                        <div className="matching-review-row">
                          <span className="matching-review-label">Notes</span>
                          <span>{proofsByApplication[item._id].notes}</span>
                        </div>
                      ) : null}

                      {proofsByApplication[item._id].approvalStatus === "pending" ? (
                        <div className="matching-review-feedback">
                          <label htmlFor={`reviewNotes-${item._id}`}>Feedback</label>
                          <textarea
                            id={`reviewNotes-${item._id}`}
                            rows="3"
                            value={reviewNotes}
                            onChange={(event) => setReviewNotes(event.target.value)}
                            placeholder="Share feedback or next steps for the influencer"
                          />
                          <div className="row gap-sm">
                            <button
                              className="btn primary"
                              onClick={() => handleReview(item._id, "approve")}
                              disabled={reviewSaving}
                            >
                              Approve
                            </button>
                            <button
                              className="btn ghost"
                              onClick={() => handleReview(item._id, "reject")}
                              disabled={reviewSaving}
                            >
                              Reject
                            </button>
                          </div>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default CampaignApplicants;
