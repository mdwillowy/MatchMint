import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getErrorMessage, getToken } from "../services/authService";
import { getProofForApplication } from "../services/proofService";
import {
  markAsPaidWithAmount,
  markCompleted,
  rejectPaymentByCompany,
  reviewProof,
} from "../services/reviewPaymentService";
import ScreenshotModal from "../components/ScreenshotModal";

function CompanyProofReview() {
  const navigate = useNavigate();
  const { applicationId } = useParams();
  const token = getToken();

  const [proof, setProof] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [paymentAmount, setPaymentAmount] = useState("");
  const [companyFeedback, setCompanyFeedback] = useState("");
  const [screenshotModalOpen, setScreenshotModalOpen] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState(null);

  const loadProof = useCallback(async () => {
    try {
      const data = await getProofForApplication(applicationId, token);
      setProof(data.proof || null);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, [applicationId, token]);

  useEffect(() => {
    loadProof();
  }, [loadProof]);

  const handleReview = async (decision) => {
    setError("");
    setSuccess("");

    try {
      const data = await reviewProof(
        {
          applicationId,
          decision,
          reviewNotes,
        },
        token
      );
      setSuccess(data.message || "Review submitted.");
      await loadProof();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handlePaid = async () => {
    setError("");
    setSuccess("");

    try {
      const amount = Number(paymentAmount);
      if (!amount || amount <= 0) {
        setError("Please enter a valid amount.");
        return;
      }

      const data = await markAsPaidWithAmount(
        {
          applicationId,
          amount,
          companyFeedback,
        },
        token
      );
      setSuccess(data.message || "Application marked paid.");
      await loadProof();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleReject = async () => {
    setError("");
    setSuccess("");

    try {
      const data = await rejectPaymentByCompany(
        {
          applicationId,
          companyFeedback,
        },
        token
      );
      setSuccess(data.message || "Application rejected.");
      await loadProof();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleComplete = async () => {
    setError("");
    setSuccess("");

    try {
      const data = await markCompleted({ applicationId }, token);
      setSuccess(data.message || "Application completed.");
      await loadProof();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const appStatus = proof?.application?.status;

  return (
    <div className="page-wrap">
      <div className="card proof-list-card">
        <div className="title-row">
          <h2>Review Proof</h2>
          <button className="btn ghost" onClick={() => navigate(-1)}>
            Back
          </button>
        </div>

        {loading ? <p className="muted">Loading proof details...</p> : null}
        {error ? <p className="error">{error}</p> : null}
        {success ? <p className="success">{success}</p> : null}

        {!loading && !proof ? (
          <p className="muted">Proof not available for this application yet.</p>
        ) : null}

        {proof ? (
          <div className="proof-item">
            <p>
              <strong>Campaign:</strong> {proof?.application?.campaign?.title || "-"}
            </p>
            <p>
              <strong>Influencer:</strong> {proof?.application?.influencer?.name || "-"}
            </p>
            <p>
              <strong>Application Status:</strong> {proof?.application?.status || "-"}
            </p>
            <p>
              <strong>Proof Approval:</strong> {proof.approvalStatus}
            </p>
            <p>
              <strong>Profile Link:</strong>{" "}
              <a href={proof.proofUrl} target="_blank" rel="noreferrer">
                Open Link
              </a>
            </p>
            {proof.secondaryLink ? (
              <p>
                <strong>Additional Link:</strong>{" "}
                <a href={proof.secondaryLink} target="_blank" rel="noreferrer">
                  Open Link
                </a>
              </p>
            ) : null}
            {proof.screenshotUrl ? (
              <p>
                <strong className="proof-item-label">Screenshot:</strong>{" "}
                <button
                  className="btn ghost"
                  onClick={() => {
                    setScreenshotUrl(proof.screenshotUrl);
                    setScreenshotModalOpen(true);
                  }}
                >
                  View Screenshot
                </button>
              </p>
            ) : null}
            {proof.notes ? (
              <p>
                <strong className="proof-item-label">Notes:</strong> <span className="proof-item-text">{proof.notes}</span>
              </p>
            ) : null}
            {proof.phone ? (
              <p>
                <strong>Phone:</strong> {proof.phone}
              </p>
            ) : null}
            {proof.reviewNotes ? (
              <p>
                <strong>Review Notes:</strong> {proof.reviewNotes}
              </p>
            ) : null}

            {proof?.application?.readyForPaymentData ? (
              <>
                <p>
                  <strong>Task Link:</strong>{" "}
                  <a
                    href={proof.application.readyForPaymentData.contentLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open Content
                  </a>
                </p>
                {proof.application.readyForPaymentData.description ? (
                  <p>
                    <strong>Task Message:</strong> {proof.application.readyForPaymentData.description}
                  </p>
                ) : null}
              </>
            ) : null}

            {proof?.application?.paymentInfo?.amount ? (
              <p>
                <strong>Paid Amount:</strong> ₹{Number(proof.application.paymentInfo.amount).toFixed(2)}
              </p>
            ) : null}

            {proof?.application?.paymentInfo?.companyFeedback ? (
              <p>
                <strong>Company Feedback:</strong> {proof.application.paymentInfo.companyFeedback}
              </p>
            ) : null}

            {proof.approvalStatus === "pending" ? (
              <>
                <label htmlFor="reviewNotes">
                  Review Notes (optional)
                </label>
                <textarea
                  id="reviewNotes"
                  rows="3"
                  value={reviewNotes}
                  onChange={(event) => setReviewNotes(event.target.value)}
                  placeholder="Add notes for influencer (for approval or rejection)"
                />
              </>
            ) : null}

            {appStatus === "approved" ? (
              <p className="muted">Waiting for influencer to submit task proof.</p>
            ) : null}

            {appStatus === "ready_for_payment" ? (
              <>
                <label htmlFor="paymentAmount">Amount (₹)</label>
                <input
                  id="paymentAmount"
                  type="number"
                  min="1"
                  value={paymentAmount}
                  onChange={(event) => setPaymentAmount(event.target.value)}
                  placeholder="Enter amount"
                />

                <label htmlFor="companyFeedback">Company Feedback (optional)</label>
                <textarea
                  id="companyFeedback"
                  rows="3"
                  value={companyFeedback}
                  onChange={(event) => setCompanyFeedback(event.target.value)}
                  placeholder="Leave feedback for the influencer"
                />

                <div className="row gap-sm proof-actions">
                  <button className="btn primary" onClick={handlePaid}>
                    Mark Paid
                  </button>
                  <button className="btn ghost" onClick={handleReject}>
                    Reject
                  </button>
                </div>
              </>
            ) : null}

            {appStatus === "paid_simulated" ? (
              <div className="row gap-sm proof-actions">
                <button className="btn primary" onClick={handleComplete}>
                  Complete Application
                </button>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

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

export default CompanyProofReview;
