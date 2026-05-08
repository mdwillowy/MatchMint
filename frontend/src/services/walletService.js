import { createApiClient } from "./apiClient";

const api = createApiClient("/wallet");

const authHeader = (token) => ({
  Authorization: `Bearer ${token}`,
});

export const getWallet = async (token) => {
  const response = await api.get("/", {
    headers: authHeader(token),
  });

  return response.data;
};

export const addMoney = async (amount, token) => {
  const response = await api.post(
    "/add-money",
    { amount },
    {
      headers: authHeader(token),
    }
  );

  return response.data;
};
