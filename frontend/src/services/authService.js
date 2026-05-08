import { createApiClient } from "./apiClient";

const TOKEN_KEY = "token";
const USER_KEY = "user";

const api = createApiClient("/auth");

export const getErrorMessage = (error) => {
  return (
    error?.response?.data?.message ||
    error?.message ||
    "Something went wrong. Please try again."
  );
};

export const saveAuthData = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

export const getStoredUser = () => {
  const userString = localStorage.getItem(USER_KEY);

  if (!userString) return null;

  try {
    return JSON.parse(userString);
  } catch {
    localStorage.removeItem(USER_KEY);
    return null;
  }
};

export const clearAuthData = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getDashboardPathByRole = (role) => {
  if (role === "company") return "/company/dashboard";
  if (role === "influencer") return "/influencer/dashboard";
  return "/";
};

export const signupUser = async (payload) => {
  const response = await api.post("/signup", payload);
  return response.data;
};

export const loginUser = async (payload) => {
  const response = await api.post("/login", payload);
  return response.data;
};

export const getCurrentUser = async (token) => {
  const response = await api.get("/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return response.data;
};
