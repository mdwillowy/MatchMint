import { createApiClient } from "./apiClient";

const api = createApiClient("/proofs");

const authHeader = (token) => ({
  Authorization: `Bearer ${token}`,
});

export const submitProof = async (data, token) => {
  const response = await api.post("/submit", data, {
    headers: {
      ...authHeader(token),
      ...(data instanceof FormData ? {} : { "Content-Type": "application/json" }),
    },
  });

  return response.data;
};

export const getMyProofs = async (token) => {
  const response = await api.get("/me", {
    headers: authHeader(token),
  });

  return response.data;
};

export const getProofForApplication = async (applicationId, token) => {
  const response = await api.get(`/application/${applicationId}`, {
    headers: authHeader(token),
  });

  return response.data;
};

export const updateProofForApplication = async (applicationId, data, token) => {
  const response = await api.put(`/application/${applicationId}`, data, {
    headers: {
      ...authHeader(token),
      ...(data instanceof FormData ? {} : { "Content-Type": "application/json" }),
    },
  });

  return response.data;
};
