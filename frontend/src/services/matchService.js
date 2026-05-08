import { createApiClient } from "./apiClient";

const api = createApiClient("/matches");

const authHeader = (token) => ({
  Authorization: `Bearer ${token}`,
});

export const getInfluencerFeed = async (token) => {
  const response = await api.get("/influencer-feed", {
    headers: authHeader(token),
  });

  return response.data;
};

export const getCompanyFeed = async (token) => {
  const response = await api.get("/company-feed", {
    headers: authHeader(token),
  });

  return response.data;
};
