import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getErrorMessage,
  getStoredUser,
  getToken,
} from "../services/authService";
import { getMyCampaigns } from "../services/campaignService";
import { getMyCompanyProfile } from "../services/profileService";
import { getCompanyPipelineStats, markCompleted } from "../services/reviewPaymentService";
import { getCompanyFeed } from "../services/matchService";

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
];

function CompanyDashboard() {
  const navigate = useNavigate();
  const token = getToken();
  const user = getStoredUser();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Campaign stats
  const [campaignStats, setCampaignStats] = useState({
    total: 0,
    draft: 0,
    published: 0,
    closed: 0,
  });

  // Feed state
  const [feedRows, setFeedRows] = useState([]);
  const [minScore, setMinScore] = useState(40);
  const [feedInfo, setFeedInfo] = useState("");

  // Pipeline state
  const [pipelineStats, setPipelineStats] = useState(null);
  const [feedLoading, setFeedLoading] = useState(true);
  const [pipelineLoading, setPipelineLoading] = useState(true);

  // Filtered feed based on score
  const filteredFeed = useMemo(() => {
    return feedRows.filter((item) => Number(item.matchScore) >= Number(minScore));
  }, [feedRows, minScore]);

  const getStatusBadgeClass = (status) => {
    if (status === "accepted") return "status-badge stage-info";
    if (status === "proof_submitted") return "status-badge stage-warning";
    if (status === "approved") return "status-badge stage-approved";
    if (status === "ready_for_payment") return "status-badge stage-ready";
    if (status === "paid_simulated") return "status-badge stage-success";
    if (status === "completed") return "status-badge stage-completed";
    if (status === "rejected") return "status-badge stage-rejected";
    if (status === "skipped") return "status-badge stage-muted";
    return "status-badge stage-muted";
  };

  const getStatusBadgeLabel = (status) => {
    if (status === "paid_simulated") return "Task Completed";
    if (status === "completed") return "Completed";
    if (status === "ready_for_payment") return "Ready for Payment";
    if (status === "proof_submitted") return "Proof Submitted";
    if (status === "approved") return "Approved";
    if (status === "rejected") return "Rejected";
    if (status === "accepted") return "Accepted";
    if (status === "skipped") return "Skipped";
    return String(status || "-")
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  };

  const pipelineCounts = pipelineStats?.counts || {};
  const totalPipelineItems = pipelineStages.reduce(
    (sum, stage) => sum + (pipelineCounts[stage.key] || 0),
    0
  );
  const completionRate =
    totalPipelineItems > 0
      ? Math.round(((pipelineCounts.completed || 0) / totalPipelineItems) * 100)
      : 0;

  const formatStageShare = (count) => {
    if (!totalPipelineItems) return 0;
    return Math.round((count / totalPipelineItems) * 100);
  };

  const scoreClassName = (score) => {
    if (score >= 80) return "score-badge score-high";
    if (score >= 60) return "score-badge score-medium";
    return "score-badge score-low";
  };


  const loadProfile = useCallback(async () => {
    try {
      const profileResponse = await getMyCompanyProfile(token).catch((err) => {
        if (err?.response?.status === 404) {
          return { profile: null };
        }
        throw err;
      });

      setProfile(profileResponse.profile || null);

      const campaignResponse = await getMyCampaigns(token);
      const campaigns = campaignResponse?.campaigns || [];
      setCampaignStats({
        total: campaigns.length,
        draft: campaigns.filter((item) => item.status === "draft").length,
        published: campaigns.filter((item) => item.status === "published").length,
        closed: campaigns.filter((item) => item.status === "closed").length,
      });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }, [token]);

  const loadFeed = useCallback(async () => {
    setFeedLoading(true);
    try {
      const data = await getCompanyFeed(token);
      setFeedRows(data.influencers || []);
      setFeedInfo(data.message || "");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setFeedLoading(false);
    }
  }, [token]);

  const loadPipeline = useCallback(async () => {
    setPipelineLoading(true);
    try {
      const data = await getCompanyPipelineStats(token);
      setPipelineStats(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPipelineLoading(false);
    }
  }, [token]);

  useEffect(() => {
    Promise.all([loadProfile(), loadFeed(), loadPipeline()]).then(() => {
      setLoading(false);
    });
  }, [loadProfile, loadFeed, loadPipeline]);

  const handleCompleteApplication = async (applicationId) => {
    try {
      await markCompleted({ applicationId }, token);
      await loadPipeline();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };


  const recentApplications = (pipelineStats?.applications || [])
    .filter((item) => ["accepted", "proof_submitted", "approved", "rejected", "ready_for_payment", "paid_simulated", "completed"].includes(item.status))
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .slice(0, 10);
  const profileCategories = profile?.categories || (profile?.category ? [profile.category] : []);

  return (
    <div className="company-dashboard-page">
      {/* Hero section with bio and categories */}
      <div className="dashboard-hero">
        <div className="dashboard-hero-content">
          <h1>Welcome, {user?.name || "Company"}!</h1>
          <p className="dashboard-intro muted">
            MatchMint connects brands with creators who deliver real impact.
          </p>
        </div>
      </div>

      {!loading && profile ? (
        <section className="dashboard-profile-section">
          <div className="profile-snapshot-card">
            <div className="profile-snapshot-header">
              <div>
                <h3>{profile?.companyName || user?.name || "Company"} Profile</h3>
                <p className="muted">
                  {profile?.description || "Share what your brand stands for."}
                </p>
              </div>
              <button
                type="button"
                className="btn ghost btn-small"
                onClick={() => navigate("/company/profile")}
              >
                Edit profile
              </button>
            </div>

            <div className="profile-snapshot-grid">
              <div className="profile-snapshot-item">
                <span className="profile-snapshot-label">Contact</span>
                <span className="profile-snapshot-value">
                  {profile.contactEmail || "Not specified"}
                </span>
              </div>
              <div className="profile-snapshot-item">
                <span className="profile-snapshot-label">Website</span>
                <span className="profile-snapshot-value">
                  {profile.website || "Not specified"}
                </span>
              </div>
              <div className="profile-snapshot-item">
                <span className="profile-snapshot-label">Categories</span>
                <span className="profile-snapshot-value">
                  {profileCategories.length > 0 ? profileCategories.join(", ") : "Not specified"}
                </span>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {error ? <p className="error" style={{ margin: "0 20px" }}>{error}</p> : null}

      {/* Metrics Grid */}
      <div className="dashboard-metrics-grid">
        <div className="metric-card">
          <p className="metric-label">Total Campaigns</p>
          <p className="metric-value">{campaignStats.total}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Published</p>
          <p className="metric-value">{campaignStats.published}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">In Draft</p>
          <p className="metric-value">{campaignStats.draft}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Closed</p>
          <p className="metric-value">{campaignStats.closed}</p>
        </div>
      </div>

      {/* Feed Section */}
      <div className="dashboard-feed-section">
        <div className="feed-section-header">
          <h2>Influencer Feed - Ranked Matches</h2>
          <div className="feed-filter-inline">
            <label htmlFor="minScore">Minimum Match Score:</label>
            <input
              id="minScore"
              type="number"
              min="0"
              max="100"
              value={minScore}
              onChange={(e) => setMinScore(e.target.value)}
            />
          </div>
        </div>

        {feedLoading ? <p className="muted">Loading influencers...</p> : null}

        {!feedLoading && filteredFeed.length === 0 ? (
          <p className="muted">No influencers found for selected score. Publish campaigns to see more results.</p>
        ) : null}

        <div className="dashboard-feed-grid">
          {filteredFeed.slice(0, 10).map((item, index) => (
            <div className="feed-card" key={item?.influencer?.id || index}>
              <div className="feed-card-header">
                <div>
                  <h3>{item?.influencer?.name || "Influencer"}</h3>
                  <p className="muted">{item?.influencer?.bio || "No bio added yet."}</p>
                </div>
                <div className="feed-card-badges">
                  <span className={scoreClassName(item.matchScore)}>
                    Match {item.matchScore}
                  </span>
                  <span className="status-badge status-info">#{index + 1}</span>
                </div>
              </div>

              <div className="feed-card-meta">
                <div className="meta-item">
                  <span className="meta-label">Email:</span>
                  <span>{item?.influencer?.email || "-"}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Audience:</span>
                  <span>{item?.influencer?.audienceSize ?? "-"}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Niches:</span>
                  <span>{(item?.influencer?.niches || []).join(", ") || "-"}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-label">Platforms:</span>
                  <span>{(item?.influencer?.platforms || []).join(", ") || "-"}</span>
                </div>
                {item?.bestCampaign?.title ? (
                  <div className="meta-item">
                    <span className="meta-label">Best Match:</span>
                    <span>{item.bestCampaign.title}</span>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>

        {!feedLoading && filteredFeed.length > 10 ? (
          <p className="muted" style={{ textAlign: "center", marginTop: "12px" }}>
            Showing top 10 of {filteredFeed.length} influencers
          </p>
        ) : null}
      </div>

      {/* Pipeline Section */}
      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <p className="dashboard-kicker">Pipeline Analytics</p>
            <h3>Stage progress and current workload</h3>
          </div>
          <p className="muted">A live view of where your applications are moving.</p>
        </div>

        {pipelineLoading ? <p className="muted">Loading pipeline...</p> : null}

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
                  <p className="dashboard-kicker">Recent Activity</p>
                  <h4>Latest applications</h4>
                </div>
              </div>

              {recentApplications.length === 0 ? (
                <p className="muted">No active applicant workflow yet.</p>
              ) : (
                <ul className="pipeline-history-list">
                  {recentApplications.map((item) => (
                    <li className="pipeline-history-item" key={item._id}>
                      <div>
                        <p className="pipeline-history-title">
                          <strong>{item?.influencer?.name || "Influencer"}</strong>
                        </p>
                        <p className="pipeline-history-meta">
                          {item?.campaign?.title || "Campaign"} • Match {item?.matchScore || "-"} • {new Date(item.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="pipeline-history-actions">
                        <span className={getStatusBadgeClass(item.status)}>
                          {getStatusBadgeLabel(item.status)}
                        </span>
                        {item.status === "paid_simulated" ? (
                          <button
                            className="btn primary btn-sm"
                            onClick={() => handleCompleteApplication(item._id)}
                          >
                            Complete
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

    </div>
  );
}

export default CompanyDashboard;
