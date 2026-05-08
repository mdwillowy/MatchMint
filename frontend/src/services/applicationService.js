import { createApiClient } from "./apiClient";

const api = createApiClient("/applications");

const authHeader = (token) => ({
  Authorization: `Bearer ${token}`,
});

export const respondToCampaign = async (payload, token) => {
  const response = await api.post("/respond", payload, {
    headers: authHeader(token),
  });

  return response.data;
};

export const getMyApplications = async (token) => {
  const response = await api.get("/me", {
    headers: authHeader(token),
  });

  return response.data;
};

export const getApplicantsForCampaign = async (campaignId, token) => {
  const response = await api.get(`/campaign/${campaignId}/applicants`, {
    headers: authHeader(token),
  });

  return response.data;
};
