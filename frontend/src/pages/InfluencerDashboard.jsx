import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AlertMessage from "../components/AlertMessage";
import EmptyState from "../components/EmptyState";
import LoadingSpinner from "../components/LoadingSpinner";
import {
  getErrorMessage,
  getStoredUser,
  getToken,
} from "../services/authService";
import { respondToCampaign } from "../services/applicationService";
import { getInfluencerFeed } from "../services/matchService";
import { getMyInfluencerProfile } from "../services/profileService";
import {
  getInfluencerPipelineStats,
  markCompleted,
} from "../services/reviewPaymentService";

const pipelineStages = [
  {
    key: "accepted",
    label: "Accepted",
    tone: "stage-info",
    description: "Campaigns you have already confirmed.",
  },
  {
    key: "proof_submitted",
    label: "Proof Submitted",
    tone: "stage-warning",
    description: "Deliverables waiting for review.",
  },
  {
    key: "approved",
    label: "Approved",
    tone: "stage-approved",
    description: "Proof cleared and ready to move forward.",
  },
  {
    key: "ready_for_payment",
    label: "Ready for Payment",
    tone: "stage-ready",
    description: "Awaiting payment completion.",
  },
  {
    key: "paid_simulated",
    label: "Paid",
    tone: "stage-success",
    description: "Payment finished, mark complete.",
  },
  {
    key: "completed",
    label: "Completed",
    tone: "stage-completed",
    description: "Finished work that is fully closed.",
  },
  {
    key: "rejected",
    label: "Rejected",
    tone: "stage-rejected",
    description: "Items that did not proceed.",
  },
  {
    key: "skipped",
    label: "Skipped",
    tone: "stage-muted",
    description: "Campaigns you passed on.",
  },
];

function InfluencerDashboard() {
  const navigate = useNavigate();
  const token = getToken();
  const user = getStoredUser();
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  const [feedCampaigns, setFeedCampaigns] = useState([]);
  const [feedLoading, setFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState("");
  const [feedInfo, setFeedInfo] = useState("");
  const [feedSuccess, setFeedSuccess] = useState("");

  const [pipelineStats, setPipelineStats] = useState(null);
  const [pipelineLoading, setPipelineLoading] = useState(true);
  const [pipelineError, setPipelineError] = useState("");

  const loadProfile = useCallback(async () => {
    try {
      const data = await getMyInfluencerProfile(token);
      setProfile(data.profile || null);
    } catch (err) {
      if (err?.response?.status !== 404) {
        setProfileError(getErrorMessage(err));
      }
    } finally {
      setProfileLoading(false);
    }
  }, [token]);

  const loadFeed = useCallback(async () => {
    try {
      const data = await getInfluencerFeed(token);
      setFeedCampaigns(data.campaigns || []);
      setFeedInfo(data.message || "");
    } catch (err) {
      setFeedError(getErrorMessage(err));
    } finally {
      setFeedLoading(false);
    }
  }, [token]);

  const loadPipeline = useCallback(async () => {
    try {
      const data = await getInfluencerPipelineStats(token);
      setPipelineStats(data);
    } catch (err) {
      setPipelineError(getErrorMessage(err));
    } finally {
      setPipelineLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadProfile();
    loadFeed();
    loadPipeline();
  }, [loadFeed, loadPipeline, loadProfile]);

  const refreshFeed = useCallback(async () => {
    setFeedLoading(true);
    setFeedError("");

    try {
      const data = await getInfluencerFeed(token);
      setFeedCampaigns(data.campaigns || []);
      setFeedInfo(data.message || "");
    } catch (err) {
      setFeedError(getErrorMessage(err));
    } finally {
      setFeedLoading(false);
    }
  }, [token]);

  const refreshPipeline = useCallback(async () => {
    setPipelineLoading(true);
    setPipelineError("");

    try {
      const data = await getInfluencerPipelineStats(token);
      setPipelineStats(data);
    } catch (err) {
      setPipelineError(getErrorMessage(err));
    } finally {
      setPipelineLoading(false);
    }
  }, [token]);

  const handleCampaignAction = async (campaignId, action) => {
    setFeedError("");
    setFeedSuccess("");

    try {
      const data = await respondToCampaign({ campaignId, action }, token);
      setFeedSuccess(data.message || "Action completed.");
      await Promise.all([refreshFeed(), refreshPipeline()]);
    } catch (err) {
      setFeedError(getErrorMessage(err));
    }
  };

  const handleComplete = async (applicationId) => {
    setPipelineError("");

    try {
      await markCompleted({ applicationId }, token);
      await refreshPipeline();
    } catch (err) {
      setPipelineError(getErrorMessage(err));
    }
  };


  const pipelineCounts = pipelineStats?.counts || {};
  const pipelineApplications = pipelineStats?.applications || [];
  const totalPipelineItems = pipelineStages.reduce(
    (sum, stage) => sum + (pipelineCounts[stage.key] || 0),
    0
  );
  const activePipelineItems =
    (pipelineCounts.accepted || 0) +
    (pipelineCounts.proof_submitted || 0) +
    (pipelineCounts.approved || 0) +
    (pipelineCounts.ready_for_payment || 0) +
    (pipelineCounts.paid_simulated || 0);
  const completionRate =
    totalPipelineItems > 0
      ? Math.round(((pipelineCounts.completed || 0) / totalPipelineItems) * 100)
      : 0;
  const topCampaigns = feedCampaigns;
  const recentApplications = [...pipelineApplications]
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .slice(0, 5);
  const profileNiches = profile?.niches || [];
  const profilePlatforms = profile?.platforms || [];

  const formatStageShare = (count) => {
    if (!totalPipelineItems) return 0;
    return Math.round((count / totalPipelineItems) * 100);
  };

  const scoreClassName = (score) => {
    if (score >= 80) return "score-badge score-high";
    if (score >= 60) return "score-badge score-medium";
    return "score-badge score-low";
  };

  const formatCompactNumber = (value) => {
    const number = Number(value);

    if (!Number.isFinite(number)) {
      return "Not specified";
    }

    return new Intl.NumberFormat("en", {
      notation: "compact",
      maximumFractionDigits: 1,
    }).format(number);
  };

  const formatBudgetRange = (minValue, maxValue) => {
    const minFormatted = formatCompactNumber(minValue);
    const maxFormatted = formatCompactNumber(maxValue);
    return `₹${minFormatted} - ₹${maxFormatted}`;
  };

  const stageBadgeClass = (status) => {
    if (status === "paid_simulated") return "status-badge stage-success";
    if (status === "ready_for_payment") return "status-badge stage-ready";
    if (status === "proof_submitted") return "status-badge stage-warning";
    if (status === "approved") return "status-badge stage-approved";
    if (status === "rejected") return "status-badge stage-rejected";
    if (status === "completed") return "status-badge stage-completed";
    if (status === "skipped") return "status-badge stage-muted";
    return "status-badge stage-info";
  };

  return (
    <main className="page-wrap influencer-dashboard-page">
      <section className="dashboard-hero">
        <div>
          <h2>Welcome, {user?.name || "Influencer user"}.</h2>
          <p className="muted dashboard-intro">
            MatchMint connects you with brands that fit your voice.
          </p>
        </div>
      </section>

      {!profileLoading && profile ? (
        <section className="dashboard-profile-section">
          <div className="profile-snapshot-card">
            <div className="profile-snapshot-header">
              <div>
                <h3>{profile?.fullName || user?.name || "Influencer"} Profile</h3>
                <p className="muted">
                  {profile?.bio || "Tell brands what makes your content stand out."}
                </p>
              </div>
              <button
                type="button"
                className="btn ghost btn-small"
                onClick={() => navigate("/influencer/profile")}
              >
                Edit profile
              </button>
            </div>

            <div className="profile-snapshot-grid">
              <div className="profile-snapshot-item">
                <span className="profile-snapshot-label">Platforms</span>
                <span className="profile-snapshot-value">
                  {profilePlatforms.length > 0 ? profilePlatforms.join(", ") : "Not specified"}
                </span>
              </div>
              <div className="profile-snapshot-item">
                <span className="profile-snapshot-label">Niches</span>
                <span className="profile-snapshot-value">
                  {profileNiches.length > 0 ? profileNiches.join(", ") : "Not specified"}
                </span>
              </div>
              <div className="profile-snapshot-item">
                <span className="profile-snapshot-label">Audience</span>
                <span className="profile-snapshot-value">
                  {formatCompactNumber(profile.audienceSize)}
                </span>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="dashboard-metrics-grid">
        <article className="dashboard-metric-card">
          <span className="dashboard-label">Matched Campaigns</span>
          <strong>{feedCampaigns.length}</strong>
          <p className="muted">Campaigns recommended to your profile.</p>
        </article>
        <article className="dashboard-metric-card">
          <span className="dashboard-label">Active Pipeline</span>
          <strong>{activePipelineItems}</strong>
          <p className="muted">Applications currently in motion.</p>
        </article>
        <article className="dashboard-metric-card">
          <span className="dashboard-label">Completion Rate</span>
          <strong>{completionRate}%</strong>
          <p className="muted">Closed work across all pipeline stages.</p>
        </article>
        <article className="dashboard-metric-card">
          <span className="dashboard-label">Ready for Payment</span>
          <strong>{pipelineCounts.ready_for_payment || 0}</strong>
          <p className="muted">Awaiting final payment completion.</p>
        </article>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <p className="dashboard-kicker">Campaign Feed</p>
            <h3>Matched opportunities</h3>
          </div>
          <p className="muted">Accept or skip directly from the dashboard.</p>
        </div>

        {feedLoading ? <LoadingSpinner label="Loading matched campaigns..." /> : null}
        <AlertMessage type="error" message={feedError} />
        <AlertMessage type="success" message={feedSuccess} />
        <AlertMessage type="info" message={feedInfo} />

        {!feedLoading && topCampaigns.length === 0 ? (
          <EmptyState
            title="No matching campaigns right now"
            subtitle="Update your influencer profile and check back later for new opportunities."
          />
        ) : null}

        <div className="dashboard-feed-grid">
          {topCampaigns.map((item) => {
            const campaign = item.campaign;

            return (
              <article className="dashboard-feed-card" key={campaign._id}>
                <div className="dashboard-feed-head">
                  <div>
                    <h4>{campaign.title}</h4>
                  </div>
                  <span className={scoreClassName(item.matchScore)}>
                    Match {item.matchScore}
                  </span>
                </div>

                <div className="dashboard-feed-footer">
                  <div className="dashboard-feed-meta">
                    <div className="dashboard-feed-meta-item">
                      <span className="dashboard-feed-meta-label">Platforms:</span>
                      <span className="dashboard-feed-meta-value">
                        {(campaign.platforms || []).join(", ") || campaign.platform}
                      </span>
                    </div>
                    <div className="dashboard-feed-meta-item">
                      <span className="dashboard-feed-meta-label">Bio:</span>
                      <span className="dashboard-feed-meta-value">{campaign.description}</span>
                    </div>
                    <div className="dashboard-feed-meta-item">
                      <span className="dashboard-feed-meta-label">Budget:</span>
                      <span className="dashboard-feed-meta-value">
                        {formatBudgetRange(campaign.budgetMin, campaign.budgetMax)}
                      </span>
                    </div>
                    <div className="dashboard-feed-meta-item">
                      <span className="dashboard-feed-meta-label">Last Date:</span>
                      <span className="dashboard-feed-meta-value">
                        {new Date(campaign.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="row gap-sm dashboard-feed-actions">
                    <button
                      className="btn ghost"
                      onClick={() => handleCampaignAction(campaign._id, "skip")}
                    >
                      Skip
                    </button>
                    <button
                      className="btn primary"
                      onClick={() => handleCampaignAction(campaign._id, "accept")}
                    >
                      Accept
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <p className="dashboard-kicker">Pipeline Analytics</p>
            <h3>Stage progress and current workload</h3>
          </div>
          <p className="muted">A live view of where your applications are moving.</p>
        </div>

        {pipelineLoading ? <LoadingSpinner label="Loading pipeline..." /> : null}
        {pipelineError ? <p className="error">{pipelineError}</p> : null}

        {pipelineStats ? (
          <div className="dashboard-pipeline-layout">
            <article className="dashboard-pipeline-summary">
              <div className="pipeline-summary-top">
                <div>
                  <span className="dashboard-label">Overall Completion</span>
                  <strong>{completionRate}%</strong>
                </div>
                <div>
                  <span className="dashboard-label">Total Items</span>
                  <strong>{totalPipelineItems}</strong>
                </div>
              </div>

              <div className="pipeline-progress-track" aria-hidden="true">
                <div
                  className="pipeline-progress-fill"
                  style={{ width: `${completionRate}%` }}
                />
              </div>

              <div className="pipeline-stage-stack">
                {pipelineStages.map((stage) => {
                  const stageCount =
                    stage.key === "paid_simulated"
                      ? (pipelineCounts.paid_simulated || 0) + (pipelineCounts.completed || 0)
                      : pipelineCounts[stage.key] || 0;

                  return (
                    <div className="pipeline-stage-row" key={stage.key}>
                      <div className="pipeline-stage-copy">
                        <span className={`status-badge ${stage.tone}`}>
                          {stage.label}
                        </span>
                        <p className="muted">{stage.description}</p>
                      </div>
                      <div className="pipeline-stage-meter">
                        <div className="pipeline-stage-bar">
                          <div
                            className={`pipeline-stage-fill ${stage.tone}`}
                            style={{ width: `${formatStageShare(stageCount)}%` }}
                          />
                        </div>
                        <strong>{stageCount}</strong>
                      </div>
                    </div>
                  );
                })}
              </div>
            </article>

            <article className="dashboard-pipeline-list">
              <div className="section-heading compact">
                <div>
                  <p className="dashboard-kicker">Recent Work</p>
                  <h4>Latest applications</h4>
                </div>
              </div>

              {recentApplications.length === 0 ? (
                <EmptyState
                  title="No applications yet"
                  subtitle="Accepted campaigns and proof submissions will appear here once you move through the pipeline."
                />
              ) : (
                <ul className="pipeline-history-list">
                  {recentApplications.map((item) => (
                    <li className="pipeline-history-item" key={item._id}>
                      <div>
                        <p className="pipeline-history-title">
                          <strong>{item?.campaign?.title || "Campaign"}</strong>
                        </p>
                        <p className="pipeline-history-meta">
                          Match {item.matchScore} • {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="pipeline-history-actions">
                        <span className={stageBadgeClass(item.status)}>
                          {item.status}
                        </span>
                        {item.status === "paid_simulated" ? (
                          <button
                            className="btn primary"
                            onClick={() => handleComplete(item._id)}
                          >
                            Mark Completed
                          </button>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </article>
          </div>
        ) : null}
      </section>

      {!profileLoading && profileError ? (
        <AlertMessage type="error" message={profileError} />
      ) : null}

      {!profileLoading && !profile ? (
        <section className="dashboard-section dashboard-empty-profile">
          <h3>Your profile is not complete yet.</h3>
          <p className="muted">
            Use the Profile link in the header to finish your influencer details and improve match quality.
          </p>
        </section>
      ) : null}

    </main>
  );
}

export default InfluencerDashboard;