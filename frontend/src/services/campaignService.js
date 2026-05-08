import { createApiClient } from "./apiClient";

const api = createApiClient("/campaigns");

const authHeader = (token) => ({
  Authorization: `Bearer ${token}`,
});

export const createCampaign = async (data, token) => {
  const response = await api.post("/", data, {
    headers: authHeader(token),
  });
  return response.data;
};

export const updateCampaign = async (id, data, token) => {
  const response = await api.put(`/${id}`, data, {
    headers: authHeader(token),
  });
  return response.data;
};

export const getMyCampaigns = async (token) => {
  const response = await api.get("/my", {
    headers: authHeader(token),
  });
  return response.data;
};

export const getCampaignById = async (id, token) => {
  const response = await api.get(`/${id}`, {
    headers: authHeader(token),
  });
  return response.data;
};

export const publishCampaign = async (id, token) => {
  const response = await api.patch(`/${id}/publish`, null, {
    headers: authHeader(token),
  });
  return response.data;
};

export const closeCampaign = async (id, token) => {
  const response = await api.patch(`/${id}/close`, null, {
    headers: authHeader(token),
  });
  return response.data;
};

export const deleteCampaign = async (id, token) => {
  const response = await api.delete(`/${id}`, {
    headers: authHeader(token),
  });
  return response.data;
};

export const getPublicCampaigns = async () => {
  const response = await api.get("/public");
  return response.data;
};

export const getPublicStats = async () => {
  const response = await api.get("/public/stats");
  return response.data;
};
