import { createApiClient } from "./apiClient";

const api = createApiClient("/profile");

const authHeader = (token) => ({
  Authorization: `Bearer ${token}`,
});

export const saveCompanyProfile = async (data, token) => {
  const response = await api.post("/company", data, {
    headers: authHeader(token),
  });
  return response.data;
};

export const getMyCompanyProfile = async (token) => {
  const response = await api.get("/company/me", {
    headers: authHeader(token),
  });
  return response.data;
};

export const saveInfluencerProfile = async (data, token) => {
  const response = await api.post("/influencer", data, {
    headers: authHeader(token),
  });
  return response.data;
};

export const getMyInfluencerProfile = async (token) => {
  const response = await api.get("/influencer/me", {
    headers: authHeader(token),
  });
  return response.data;
};
