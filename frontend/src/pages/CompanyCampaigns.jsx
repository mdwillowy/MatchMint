import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AlertMessage from "../components/AlertMessage";
import EmptyState from "../components/EmptyState";
import LoadingSpinner from "../components/LoadingSpinner";
import ScreenshotModal from "../components/ScreenshotModal";
import { getErrorMessage, getToken } from "../services/authService";
import { getApplicantsForCampaign } from "../services/applicationService";
import {
  deleteCampaign,
  closeCampaign,
  getMyCampaigns,
  publishCampaign,
} from "../services/campaignService";
import { getProofForApplication } from "../services/proofService";
import {
  reviewProof,
  markAsPaidSimulated,
  markAsPaidWithAmount,
  rejectPaymentByCompany,
} from "../services/reviewPaymentService";

function CompanyCampaigns() {
  const navigate = useNavigate();
  const token = getToken();

  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [activeCampaign, setActiveCampaign] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [applicantsLoading, setApplicantsLoading] = useState(false);
  const [applicantsError, setApplicantsError] = useState("");
  const [proofsByApplication, setProofsByApplication] = useState({});
  const [reviewNotesByApp, setReviewNotesByApp] = useState({});
  const [reviewSaving, setReviewSaving] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentForm, setPaymentForm] = useState({ applicationId: null, amount: "", companyFeedback: "" });
  const [paymentError, setPaymentError] = useState("");
  const [paymentViewData, setPaymentViewData] = useState(null);
  const [screenshotModalOpen, setScreenshotModalOpen] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState(null);

  const fetchCampaigns = useCallback(async () => {
    try {
      const data = await getMyCampaigns(token);
      setCampaigns(data.campaigns || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handlePublish = async (id) => {
    const ok = window.confirm("Publish this campaign now?");
    if (!ok) return;

    setError("");
    setSuccess("");

    try {
      const data = await publishCampaign(id, token);
      setSuccess(data.message || "Campaign published successfully.");
      fetchCampaigns();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleClose = async (id) => {
    const ok = window.confirm("Close this campaign now?");
    if (!ok) return;

    setError("");
    setSuccess("");

    try {
      const data = await closeCampaign(id, token);
      setSuccess(data.message || "Campaign closed successfully.");
      fetchCampaigns();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleDelete = async (id) => {
    const ok = window.confirm(
      "Delete this campaign permanently? This cannot be undone."
    );
    if (!ok) return;

    setError("");
    setSuccess("");

    try {
      const data = await deleteCampaign(id, token);
      setSuccess(data.message || "Campaign deleted successfully.");
      fetchCampaigns();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const statusClassName = (status) => {
    if (status === "draft") return "status-badge status-draft";
    if (status === "published") return "status-badge status-published";
    return "status-badge status-closed";
  };

  const applicantStatusClass = (status) => {
    if (status === "accepted") return "status-badge status-info";
    if (status === "proof_submitted") return "status-badge status-warning";
    if (status === "approved") return "status-badge status-approved";
    if (status === "rejected") return "status-badge status-rejected";
    if (status === "ready_for_payment") return "status-badge status-ready";
    if (status === "paid_simulated") return "status-badge status-success";
    if (status === "completed") return "status-badge status-completed";
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

  const loadApplicants = useCallback(
    async (campaign) => {
      setApplicantsLoading(true);
      setApplicantsError("");
      setProofsByApplication({});
      setApplicants([]);

      try {
        const data = await getApplicantsForCampaign(campaign._id, token);
        const nextApplicants = data.applicants || [];
        setApplicants(nextApplicants);
        
        // Load proofs for all applicants to show rejected/approved status
        if (nextApplicants.length) {
          const proofResults = await Promise.all(
            nextApplicants.map(async (item) => {
              try {
                const proofData = await getProofForApplication(item._id, token);
                return [item._id, proofData.proof];
              } catch (err) {
                return [item._id, null];
              }
            })
          );

          const proofMap = proofResults.reduce((acc, [key, value]) => {
            if (value) {
              acc[key] = value;
            }
            return acc;
          }, {});
          setProofsByApplication(proofMap);
        }
      } catch (err) {
        setApplicantsError(getErrorMessage(err));
      } finally {
        setApplicantsLoading(false);
      }
    },
    [token]
  );

  const openApplicantsModal = (campaign) => {
    setActiveCampaign(campaign);
    setModalOpen(true);
    loadApplicants(campaign);
  };

  const handleReview = async (applicationId, decision) => {
    setReviewSaving(true);
    setApplicantsError("");

    try {
      await reviewProof(
        {
          applicationId,
          decision,
          reviewNotes: reviewNotesByApp[applicationId] || "",
        },
        token
      );

      if (activeCampaign) {
        await loadApplicants(activeCampaign);
      }
    } catch (err) {
      setApplicantsError(getErrorMessage(err));
    } finally {
      setReviewSaving(false);
    }
  };

  const openPaymentModal = (applicationId, readyData = null) => {
    setPaymentForm({ applicationId, amount: "", companyFeedback: "" });
    setPaymentViewData(readyData || null);
    setPaymentError("");
    setPaymentModalOpen(true);
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;
    setPaymentForm((p) => ({ ...p, [name]: value }));
  };

  const handleSubmitPayment = async (e) => {
    e.preventDefault();
    setPaymentError("");
    setReviewSaving(true);

    const amt = Number(paymentForm.amount);
    if (!amt || amt <= 0) {
      setPaymentError("Please enter a valid amount.");
      setReviewSaving(false);
      return;
    }

    try {
      await markAsPaidWithAmount(
        {
          applicationId: paymentForm.applicationId,
          amount: amt,
          companyFeedback: paymentForm.companyFeedback,
        },
        token
      );

      setPaymentModalOpen(false);
      if (activeCampaign) await loadApplicants(activeCampaign);
    } catch (err) {
      setPaymentError(getErrorMessage(err));
    } finally {
      setReviewSaving(false);
    }
  };

  const handleRejectPayment = async () => {
    if (!window.confirm("Reject this payment request?")) return;
    setReviewSaving(true);
    setPaymentError("");

    try {
      await rejectPaymentByCompany(
        {
          applicationId: paymentForm.applicationId,
          companyFeedback: paymentForm.companyFeedback,
        },
        token
      );

      setPaymentModalOpen(false);
      if (activeCampaign) await loadApplicants(activeCampaign);
    } catch (err) {
      setPaymentError(getErrorMessage(err));
    } finally {
      setReviewSaving(false);
    }
  };

  return (
    <div className="page-wrap">
      <div className="card campaign-list-card">
        <div className="title-row">
          <h2>My Campaigns</h2>
          <div className="row gap-sm">
            <button
              className="btn primary"
              onClick={() => navigate("/company/campaigns/new")}
            >
              Create Campaign
            </button>
          </div>
        </div>

        {loading ? <LoadingSpinner label="Loading your campaigns..." /> : null}
        <AlertMessage type="error" message={error} />
        <AlertMessage type="success" message={success} />

        {!loading && campaigns.length === 0 ? (
          <EmptyState
            title="No campaigns yet"
            subtitle="Create your first campaign to start getting applications."
          />
        ) : null}

        <div className="campaign-list">
          {campaigns.map((campaign) => (
            <div className="campaign-item" key={campaign._id}>
              <div className="campaign-item-head">
                <h3>{campaign.title}</h3>
                <span className={statusClassName(campaign.status)}>
                  {campaign.status}
                </span>
              </div>

              <p className="muted campaign-desc">{campaign.description}</p>

              <div className="campaign-meta">
                <span>Categories: {Array.isArray(campaign.category) ? campaign.category.join(", ") : campaign.category}</span>
                <span>Platforms: {(campaign.platforms || []).join(", ") || campaign.platform}</span>
                <span>
                  Budget: {campaign.budgetMin} - {campaign.budgetMax}
                </span>
                <span>
                  Dates: {new Date(campaign.startDate).toLocaleDateString()} to{" "}
                  {new Date(campaign.endDate).toLocaleDateString()}
                </span>
              </div>

              <div className="row gap-sm campaign-actions">
                <button
                  className="btn ghost"
                  onClick={() => openApplicantsModal(campaign)}
                >
                  View Applicants
                </button>

                {campaign.status === "draft" ? (
                  <>
                    <button
                      className="btn ghost"
                      onClick={() =>
                        navigate(`/company/campaigns/${campaign._id}/edit`)
                      }
                    >
                      Edit
                    </button>
                    <button
                      className="btn primary"
                      onClick={() => handlePublish(campaign._id)}
                    >
                      Publish
                    </button>
                  </>
                ) : null}

                {campaign.status === "published" ? (
                  <button
                    className="btn primary"
                    onClick={() => handleClose(campaign._id)}
                  >
                    Close
                  </button>
                ) : null}
                {campaign.hasAcceptedApplications ? null : (
                  <button
                    className="btn danger"
                    onClick={() => handleDelete(campaign._id)}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {modalOpen ? (
        <div
          className="applicants-modal-overlay"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="applicants-modal-card"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="applicants-modal-head">
              <div>
                <h3>Campaign Applicants</h3>
                <p className="muted">
                  {activeCampaign?.title || "Campaign"} ({activeCampaign?.status || "-"})
                </p>
              </div>
              <button
                type="button"
                className="btn ghost"
                onClick={() => setModalOpen(false)}
              >
                Close
              </button>
            </div>

            {applicantsLoading ? <p className="muted">Loading applicants...</p> : null}
            {applicantsError ? <p className="error">{applicantsError}</p> : null}

            {!applicantsLoading && applicants.length === 0 ? (
              <p className="muted">No applicants yet for this campaign.</p>
            ) : null}

            <div className="applicants-list">
              {applicants.map((item) => {
                const proof = proofsByApplication[item._id];

                return (
                  <div className="applicant-card" key={item._id}>
                    <div className="applicant-head">
                      <div>
                        <h4>{item?.influencer?.name || "Influencer"}</h4>
                        <p className="muted">Email: {item?.influencer?.email || "-"}</p>
                        <p className="muted">Responded: {new Date(item.createdAt).toLocaleDateString()}</p>
                      </div>
                      <div className="applicant-head-actions">
                        <div className="row gap-sm applicant-head-badges">
                          <span className={applicantStatusClass(item.status)}>
                            {formatStatusLabel(item.status)}
                          </span>
                          {proof ? (
                            <span className={approvalClassName(proof.approvalStatus)}>
                              Proof: {formatStatusLabel(proof.approvalStatus)}
                            </span>
                          ) : null}
                          <span className="score-badge score-medium">Match {item.matchScore}</span>
                        </div>
                        {item.status === "ready_for_payment" ? (
                          <div className="applicant-head-action">
                            <button
                              className="btn primary btn-sm"
                              onClick={() => openPaymentModal(item._id, item.readyForPaymentData)}
                              disabled={reviewSaving}
                            >
                              Review for Payment
                            </button>
                          </div>
                        ) : null}
                      </div>
                    </div>

                    {proof ? (
                      <div className="applicant-proof">
                        <div className="applicant-proof-row">
                          <span className="applicant-proof-label">Profile Link</span>
                          <a className="applicant-proof-link" href={proof.proofUrl} target="_blank" rel="noreferrer">
                            Open Link
                          </a>
                        </div>
                        {proof.secondaryLink ? (
                          <div className="applicant-proof-row">
                            <span className="applicant-proof-label">Additional Link</span>
                            <a className="applicant-proof-link" href={proof.secondaryLink} target="_blank" rel="noreferrer">
                              Open Link
                            </a>
                          </div>
                        ) : null}
                        {proof.screenshotUrl ? (
                          <div className="applicant-proof-row">
                            <span className="applicant-proof-label">Screenshot</span>
                            <button
                              className="applicant-proof-link"
                              onClick={() => {
                                setScreenshotUrl(proof.screenshotUrl);
                                setScreenshotModalOpen(true);
                              }}
                            >
                              View Screenshot
                            </button>
                          </div>
                        ) : null}
                        {proof.notes ? (
                          <div className="applicant-proof-row">
                            <span className="applicant-proof-label">Notes</span>
                            <span>{proof.notes}</span>
                          </div>
                        ) : null}

                        {proof.application?.readyForPaymentData ? (
                          <>
                            <div className="applicant-proof-row">
                              <span className="applicant-proof-label">Task Link</span>
                              <a
                                className="applicant-proof-link"
                                href={proof.application.readyForPaymentData.contentLink}
                                target="_blank"
                                rel="noreferrer"
                              >
                                Open Content
                              </a>
                            </div>
                            {proof.application.readyForPaymentData.description ? (
                              <div className="applicant-proof-row">
                                <span className="applicant-proof-label">Task Message</span>
                                <span>{proof.application.readyForPaymentData.description}</span>
                              </div>
                            ) : null}
                          </>
                        ) : null}

                        {proof.application?.paymentInfo ? (
                          <div className="applicant-proof-row">
                            <span className="applicant-proof-label">Paid Amount</span>
                            <span>
                              ₹{proof.application.paymentInfo.amount ? Number(proof.application.paymentInfo.amount).toFixed(2) : ""}
                            </span>
                          </div>
                        ) : null}

                        {proof.application?.paymentInfo?.companyFeedback ? (
                          <div className="applicant-proof-row">
                            <span className="applicant-proof-label">Company Feedback</span>
                            <span>{proof.application.paymentInfo.companyFeedback}</span>
                          </div>
                        ) : null}

                        {proof.application?.paymentInfo?.paidAt ? (
                          <div className="applicant-proof-row">
                            <span className="applicant-proof-label">Paid on</span>
                            <span className="muted">
                              {new Date(proof.application.paymentInfo.paidAt).toLocaleString()}
                            </span>
                          </div>
                        ) : null}

                        {proof.approvalStatus === "pending" ? (
                          <div className="applicant-feedback">
                            <label htmlFor={`feedback-${item._id}`}>Feedback</label>
                            <textarea
                              id={`feedback-${item._id}`}
                              rows="3"
                              value={reviewNotesByApp[item._id] || ""}
                              onChange={(event) =>
                                setReviewNotesByApp((prev) => ({
                                  ...prev,
                                  [item._id]: event.target.value,
                                }))
                              }
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
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
      {paymentModalOpen ? (
        <div className="proof-modal-overlay" onClick={() => setPaymentModalOpen(false)}>
          <div className="proof-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="proof-modal-header">
              <h3>Review for Payment</h3>
              <button
                type="button"
                className="proof-modal-close"
                onClick={() => setPaymentModalOpen(false)}
                aria-label="Close payment review"
              >
                x
              </button>
            </div>
            <form className="form proof-card" onSubmit={handleSubmitPayment}>
              {paymentViewData ? (
                <div className="applicant-proof-row">
                  <span className="applicant-proof-label">Task Link</span>
                  <a href={paymentViewData.contentLink} target="_blank" rel="noreferrer">
                    Open Content
                  </a>
                </div>
              ) : null}
              {paymentViewData?.description ? (
                <div className="applicant-proof-row">
                  <span className="applicant-proof-label">Task Message</span>
                  <span>{paymentViewData.description}</span>
                </div>
              ) : null}
              <label htmlFor="amount">Amount (₹)</label>
              <input
                id="amount"
                name="amount"
                value={paymentForm.amount}
                onChange={handlePaymentChange}
                placeholder="0"
                type="number"
                min="1"
                required
              />

              <label htmlFor="companyFeedback">Company Feedback (optional)</label>
              <textarea
                id="companyFeedback"
                name="companyFeedback"
                rows="3"
                value={paymentForm.companyFeedback}
                onChange={handlePaymentChange}
                placeholder="Leave a note for the influencer"
              />

              {paymentError ? <p className="error">{paymentError}</p> : null}

              <div className="row gap-sm">
                <button className="btn primary" type="submit" disabled={reviewSaving}>
                  {reviewSaving ? "Processing..." : "Mark Paid"}
                </button>
                <button
                  className="btn danger"
                  type="button"
                  onClick={handleRejectPayment}
                  disabled={reviewSaving}
                >
                  Reject
                </button>
                <button
                  className="btn ghost"
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      <ScreenshotModal
        isOpen={screenshotModalOpen}
        imageUrl={screenshotUrl}
        onClose={() => {
          setScreenshotModalOpen(false);
          setScreenshotUrl(null);
        }}
        title="Proof Screenshot"
      />
    </div>
  );
}

export default CompanyCampaigns;
