import { createApiClient } from "./apiClient";

const api = createApiClient("/review-payment");

const authHeader = (token) => ({
  Authorization: `Bearer ${token}`,
});

export const getInfluencerPipelineStats = async (token) => {
  const response = await api.get("/influencer/stats", {
    headers: authHeader(token),
  });

  return response.data;
};

export const getCompanyPipelineStats = async (token) => {
  const response = await api.get("/company/stats", {
    headers: authHeader(token),
  });

  return response.data;
};

export const reviewProof = async (data, token) => {
  const response = await api.patch("/review", data, {
    headers: authHeader(token),
  });

  return response.data;
};

export const markReadyForPayment = async (data, token) => {
  const response = await api.patch("/ready", data, {
    headers: authHeader(token),
  });

  return response.data;
};

export const markAsPaidSimulated = async (data, token) => {
  const response = await api.patch("/paid", data, {
    headers: authHeader(token),
  });

  return response.data;
};

export const markAsPaidWithAmount = async (data, token) => {
  const response = await api.patch("/paid", data, {
    headers: authHeader(token),
  });

  return response.data;
};

export const rejectPaymentByCompany = async (data, token) => {
  const response = await api.patch("/paid/reject", data, {
    headers: authHeader(token),
  });

  return response.data;
};

export const markCompleted = async (data, token) => {
  const response = await api.patch("/complete", data, {
    headers: authHeader(token),
  });

  return response.data;
};

export const submitReadyForPayment = async (applicationId, data, token) => {
  const response = await api.patch(`/ready-for-payment/${applicationId}`, data, {
    headers: authHeader(token),
  });

  return response.data;
};
