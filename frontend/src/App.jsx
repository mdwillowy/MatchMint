import { BrowserRouter, Route, Routes } from "react-router-dom";
import AppShell from "./components/AppShell";
import ProtectedRoute from "./components/ProtectedRoute";
import CampaignApplicants from "./pages/CampaignApplicants";
import CompanyCampaigns from "./pages/CompanyCampaigns";
import CompanyDashboard from "./pages/CompanyDashboard";
import CompanyProofReview from "./pages/CompanyProofReview";
import CompanyProfile from "./pages/CompanyProfile";
import CreateCampaign from "./pages/CreateCampaign";
import EditCampaign from "./pages/EditCampaign";
import Home from "./pages/Home";
import InfluencerDashboard from "./pages/InfluencerDashboard";
import InfluencerProfile from "./pages/InfluencerProfile";
import Login from "./pages/Login";
import MyApplications from "./pages/MyApplications";
import MyProofs from "./pages/MyProofs";
import NotFound from "./pages/NotFound";
import Payment from "./pages/Payment";
import Signup from "./pages/Signup";
import SubmitProof from "./pages/SubmitProof";
import "./styles/auth.css";
import "./styles/campaign.css";
import "./styles/matching.css";
import "./styles/payment.css";
import "./styles/pipeline.css";
import "./styles/proof.css";
import "./styles/profile.css";
import "./styles/ui.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />

          <Route element={<ProtectedRoute allowedRole={["company", "influencer"]} />}>
            <Route path="/payments" element={<Payment />} />
          </Route>

          <Route element={<ProtectedRoute allowedRole="company" />}>
            <Route path="/company/dashboard" element={<CompanyDashboard />} />
            <Route path="/company/profile" element={<CompanyProfile />} />
            <Route path="/company/campaigns" element={<CompanyCampaigns />} />
            <Route path="/company/campaigns/new" element={<CreateCampaign />} />
            <Route path="/company/campaigns/:id/edit" element={<EditCampaign />} />
            <Route
              path="/company/campaigns/:id/applicants"
              element={<CampaignApplicants />}
            />
            <Route
              path="/company/applications/:applicationId/review-proof"
              element={<CompanyProofReview />}
            />
          </Route>

          <Route element={<ProtectedRoute allowedRole="influencer" />}>
            <Route
              path="/influencer/dashboard"
              element={<InfluencerDashboard />}
            />
            <Route path="/influencer/applications" element={<MyApplications />} />
            <Route
              path="/influencer/applications/:applicationId/submit-proof"
              element={<SubmitProof />}
            />
            <Route path="/influencer/proofs" element={<MyProofs />} />
            <Route
              path="/influencer/profile"
              element={<InfluencerProfile />}
            />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
