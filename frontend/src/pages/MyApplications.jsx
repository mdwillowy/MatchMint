import { useEffect, useState } from "react";
import { getErrorMessage, getToken } from "../services/authService";
import { getMyApplications } from "../services/applicationService";
import {
  getMyProofs,
  submitProof,
  updateProofForApplication,
} from "../services/proofService";
import { submitReadyForPayment } from "../services/reviewPaymentService";
import ScreenshotModal from "../components/ScreenshotModal";

function MyApplications() {
  const token = getToken();

  const [applications, setApplications] = useState([]);
  const [proofsByApplication, setProofsByApplication] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [readyPaymentModalOpen, setReadyPaymentModalOpen] = useState(false);
  const [completedApplicationModalOpen, setCompletedApplicationModalOpen] = useState(false);
  const [activeApplication, setActiveApplication] = useState(null);
  const [activeProof, setActiveProof] = useState(null);
  const [formData, setFormData] = useState({
    profileLink: "",
    secondaryLink: "",
    screenshot: null,
    phone: "",
    notes: "",
  });
  const [readyPaymentData, setReadyPaymentData] = useState({
    contentLink: "",
    description: "",
  });
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [readyPaymentError, setReadyPaymentError] = useState("");
  const [readyPaymentSuccess, setReadyPaymentSuccess] = useState("");
  const [screenshotModalOpen, setScreenshotModalOpen] = useState(false);
  const [screenshotUrl, setScreenshotUrl] = useState(null);

  useEffect(() => {
    const loadApplications = async () => {
      try {
        const [appsResponse, proofsResponse] = await Promise.all([
          getMyApplications(token),
          getMyProofs(token),
        ]);
        const data = appsResponse;
        setApplications(data.applications || []);
        const proofs = proofsResponse.proofs || [];
        const proofMap = proofs.reduce((acc, proof) => {
          if (proof.application?._id) {
            acc[proof.application._id] = proof;
          }
          return acc;
        }, {});
        setProofsByApplication(proofMap);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    };

    loadApplications();
  }, [token]);

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

  const openProofModal = (application, proof) => {
    setActiveApplication(application);
    setActiveProof(proof || null);
    setFormData({
      profileLink: proof?.proofUrl || "",
      secondaryLink: proof?.secondaryLink || "",
      screenshot: null,
      phone: proof?.phone || "",
      notes: proof?.notes || "",
    });
    setError("");
    setSuccess("");
    setModalOpen(true);
  };

  const handleFormChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (event) => {
    const file = event.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, screenshot: file }));
  };

  const handleSubmitProof = async (event) => {
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

    if (!formData.screenshot && !activeProof?.screenshotUrl) {
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
      payload.append("applicationId", activeApplication?._id || "");
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

      const data = activeProof
        ? await updateProofForApplication(activeApplication._id, payload, token)
        : await submitProof(payload, token);
      setSuccess(data.message || "Proof submitted successfully.");
      setModalOpen(false);
      const proofResponse = await getMyProofs(token);
      const proofMap = (proofResponse.proofs || []).reduce((acc, proof) => {
        if (proof.application?._id) {
          acc[proof.application._id] = proof;
        }
        return acc;
      }, {});
      setProofsByApplication(proofMap);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const openReadyPaymentModal = (application) => {
    setActiveApplication(application);
    setReadyPaymentData({
      contentLink: application?.readyForPaymentData?.contentLink || "",
      description: application?.readyForPaymentData?.description || "",
    });
    setReadyPaymentError("");
    setReadyPaymentSuccess("");
    setReadyPaymentModalOpen(true);
  };

  const openCompletedApplicationModal = (application) => {
    setActiveApplication(application);
    setCompletedApplicationModalOpen(true);
  };

  const handleReadyPaymentChange = (event) => {
    const { name, value } = event.target;
    setReadyPaymentData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitReadyPayment = async (event) => {
    event.preventDefault();
    setReadyPaymentError("");
    setReadyPaymentSuccess("");

    if (!readyPaymentData.contentLink.trim()) {
      setReadyPaymentError("Content link is required.");
      return;
    }

    setSaving(true);

    try {
      const data = await submitReadyForPayment(
        activeApplication._id,
        {
          contentLink: readyPaymentData.contentLink.trim(),
          description: readyPaymentData.description.trim(),
        },
        token
      );
      setReadyPaymentSuccess(data.message || "Submitted for payment successfully.");
      setReadyPaymentModalOpen(false);
      const appsResponse = await getMyApplications(token);
      setApplications(appsResponse.applications || []);
    } catch (err) {
      setReadyPaymentError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-wrap">
      <div className="card matching-card">
        <div className="title-row">
          <h2>My Applications</h2>
        </div>

        {loading ? <p className="muted">Loading applications...</p> : null}
        {error ? <p className="error">{error}</p> : null}

        {!loading && applications.length === 0 ? (
          <p className="muted">No applications yet.</p>
        ) : null}

        <div className="matching-list">
          {applications.map((item) => (
            <div className="matching-item" key={item._id}>
              <div className="matching-item-head">
                <h3>{item?.campaign?.title || "Campaign removed"}</h3>
                <div className="row gap-sm">
                  <span className={statusClassName(item.status)}>{item.status}</span>
                  <span className="score-badge score-medium">
                    Match {item.matchScore}
                  </span>
                </div>
              </div>

              <div className="matching-meta">
                <span>
                  Category:{" "}
                  {Array.isArray(item?.campaign?.category)
                    ? item.campaign.category.join(", ")
                    : item?.campaign?.category || "-"}
                </span>
                <span>
                  Platform:{" "}
                  {Array.isArray(item?.campaign?.platforms)
                    ? item.campaign.platforms.join(", ")
                    : item?.campaign?.platform || "-"}
                </span>
                <span>
                  Budget: {item?.campaign?.budgetMin ?? "-"} - {item?.campaign?.budgetMax ?? "-"}
                </span>
                <span>
                  Responded: {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>

              {item.status === "accepted" || proofsByApplication[item._id] ? (
                <div className="proof-inline">
                  <div className="proof-inline-head">
                    <span className="proof-inline-title">Proof Details</span>
                    {item.status === "accepted" && !proofsByApplication[item._id] ? (
                      <button
                        className="btn ghost btn-sm"
                        type="button"
                        onClick={() => openProofModal(item)}
                      >
                        Submit Proof
                      </button>
                    ) : null}
                    {proofsByApplication[item._id]?.approvalStatus === "pending" ? (
                      <button
                        className="btn ghost btn-sm"
                        type="button"
                        onClick={() =>
                          openProofModal(item, proofsByApplication[item._id])
                        }
                      >
                        Edit Proof
                      </button>
                    ) : null}
                    {item.status === "approved" ? (
                      <div className="row gap-sm">
                        <button
                          className="btn primary btn-sm"
                          type="button"
                          onClick={() => openReadyPaymentModal(item)}
                        >
                          Task Proof
                        </button>
                      </div>
                    ) : null}
                    {item.status === "ready_for_payment" && item.readyForPaymentData ? (
                      <button
                        className="btn ghost btn-sm"
                        type="button"
                        onClick={() => openReadyPaymentModal(item)}
                      >
                        Task Proof Submitted
                      </button>
                    ) : null}
                    {(item.status === "paid_simulated" || item.status === "completed") ? (
                      <button
                        className="btn primary btn-sm"
                        type="button"
                        onClick={() => openCompletedApplicationModal(item)}
                      >
                        Completed Application
                      </button>
                    ) : null}
                    {proofsByApplication[item._id]?.approvalStatus === "rejected" ? (
                      <span className="status-badge status-rejected">Rejected</span>
                    ) : null}
                  </div>
                  {proofsByApplication[item._id] ? (
                    <>
                      <p>
                        <strong className="proof-item-label">Profile:</strong>{" "}
                        <a
                          className="proof-inline-link"
                          href={proofsByApplication[item._id].proofUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View Profile Link
                        </a>
                      </p>
                      {proofsByApplication[item._id].secondaryLink ? (
                        <p>
                          <strong className="proof-item-label">Additional Link:</strong>{" "}
                          <a
                            className="proof-inline-link"
                            href={proofsByApplication[item._id].secondaryLink}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View Link
                          </a>
                        </p>
                      ) : null}
                      {proofsByApplication[item._id].screenshotUrl ? (
                        <p>
                          <strong className="proof-item-label">Screenshot:</strong>{" "}
                          <button
                            className="proof-inline-link"
                            onClick={() => {
                              setScreenshotUrl(proofsByApplication[item._id].screenshotUrl);
                              setScreenshotModalOpen(true);
                            }}
                          >
                            View Screenshot
                          </button>
                        </p>
                      ) : null}
                      {proofsByApplication[item._id].notes ? (
                        <p>
                          <strong className="proof-item-label">Notes:</strong> <span className="proof-item-text">{proofsByApplication[item._id].notes}</span>
                        </p>
                      ) : null}
                      {/* Task proof content hidden here; badge/button indicates submission. Open Completed Application to view details. */}
                      {(item.status === "paid_simulated" || item.status === "completed") && item.paymentInfo ? (
                        <div className="payment-info">
                          <p>
                            <strong>Paid Amount:</strong> ₹{item.paymentInfo.amount?.toFixed ? item.paymentInfo.amount.toFixed(2) : item.paymentInfo.amount}
                          </p>
                          {item.paymentInfo.companyFeedback ? (
                            <p>
                              <strong>Company Feedback:</strong> {item.paymentInfo.companyFeedback}
                            </p>
                          ) : null}
                          {item.paymentInfo.paidAt ? (
                            <p className="muted">Paid on: {new Date(item.paymentInfo.paidAt).toLocaleString()}</p>
                          ) : null}
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <p className="muted">No proof submitted yet.</p>
                  )}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {modalOpen ? (
        <div className="proof-modal-overlay" onClick={() => setModalOpen(false)}>
          <div className="proof-modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="proof-modal-header">
              <h3>Submit Proof</h3>
              <button
                type="button"
                className="proof-modal-close"
                onClick={() => setModalOpen(false)}
                aria-label="Close submit proof"
              >
                x
              </button>
            </div>
            <p className="required-note">
              Fields marked <span className="required-star">*</span> are required.
            </p>
            <form className="form proof-card" onSubmit={handleSubmitProof}>
              <label htmlFor="profileLink">
                Profile Link <span className="required-star">*</span>
              </label>
              <input
                id="profileLink"
                name="profileLink"
                value={formData.profileLink}
                onChange={handleFormChange}
                placeholder="https://instagram.com/your-profile"
                required
              />

              <label htmlFor="secondaryLink">Additional Link</label>
              <input
                id="secondaryLink"
                name="secondaryLink"
                value={formData.secondaryLink}
                onChange={handleFormChange}
                placeholder="https://youtube.com/your-channel"
              />

              <label htmlFor="screenshot">
                Screenshot <span className="required-star">*</span>
                <span className="field-hint">(Max 2MB)</span>
              </label>
              <input
                id="screenshot"
                type="file"
                name="screenshot"
                accept="image/*"
                onChange={handleFileChange}
              />
              {activeProof?.screenshotUrl ? (
                <p className="muted">Current screenshot on file.</p>
              ) : null}

              <label htmlFor="phone">
                Phone <span className="optional-text">Optional</span>
              </label>
              <input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleFormChange}
                placeholder="+1 555 000 0000"
              />

              <label htmlFor="notes">
                Notes <span className="required-star">*</span>
              </label>
              <textarea
                id="notes"
                name="notes"
                rows="3"
                value={formData.notes}
                onChange={handleFormChange}
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
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {readyPaymentModalOpen ? (
        <div className="proof-modal-overlay" onClick={() => setReadyPaymentModalOpen(false)}>
          <div className="proof-modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="proof-modal-header">
              <h3>Task Proof</h3>
              <button
                type="button"
                className="proof-modal-close"
                onClick={() => setReadyPaymentModalOpen(false)}
                aria-label="Close ready for payment"
              >
                x
              </button>
            </div>
            <p className="required-note">
              Fields marked <span className="required-star">*</span> are required.
            </p>
            <form className="form proof-card" onSubmit={handleSubmitReadyPayment}>
              <label htmlFor="contentLink">
                Content Link <span className="required-star">*</span>
              </label>
              <input
                id="contentLink"
                name="contentLink"
                value={readyPaymentData.contentLink}
                onChange={handleReadyPaymentChange}
                placeholder="https://example.com/content"
                required
              />

              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                name="description"
                rows="3"
                value={readyPaymentData.description}
                onChange={handleReadyPaymentChange}
              />

              {readyPaymentError ? <p className="error">{readyPaymentError}</p> : null}
              {readyPaymentSuccess ? <p className="success">{readyPaymentSuccess}</p> : null}

              <div className="row gap-sm">
                <button className="btn primary" type="submit" disabled={saving}>
                  {saving ? "Submitting..." : "Submit for Payment"}
                </button>
                <button
                  className="btn ghost"
                  type="button"
                  onClick={() => setReadyPaymentModalOpen(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {completedApplicationModalOpen ? (
        <div
          className="proof-modal-overlay"
          onClick={() => setCompletedApplicationModalOpen(false)}
        >
          <div className="proof-modal-card" onClick={(event) => event.stopPropagation()}>
            <div className="proof-modal-header">
              <h3>Completed Application</h3>
              <button
                type="button"
                className="proof-modal-close"
                onClick={() => setCompletedApplicationModalOpen(false)}
                aria-label="Close completed application"
              >
                x
              </button>
            </div>

            <div className="proof-card">
              {activeApplication?.readyForPaymentData?.contentLink ? (
                <p>
                  <strong>Task Link:</strong>{" "}
                  <a
                    href={activeApplication.readyForPaymentData.contentLink}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open Content
                  </a>
                </p>
              ) : null}

              {activeApplication?.readyForPaymentData?.description ? (
                <p>
                  <strong>Task Message:</strong> {activeApplication.readyForPaymentData.description}
                </p>
              ) : null}

              {activeApplication?.paymentInfo?.amount ? (
                <p>
                  <strong>Paid Amount:</strong> ₹{Number(activeApplication.paymentInfo.amount).toFixed(2)}
                </p>
              ) : null}

              {activeApplication?.paymentInfo?.companyFeedback ? (
                <p>
                  <strong>Company Feedback:</strong> {activeApplication.paymentInfo.companyFeedback}
                </p>
              ) : null}

              {activeApplication?.paymentInfo?.paidAt ? (
                <p className="muted">
                  Paid on: {new Date(activeApplication.paymentInfo.paidAt).toLocaleString()}
                </p>
              ) : null}
            </div>
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

export default MyApplications;
