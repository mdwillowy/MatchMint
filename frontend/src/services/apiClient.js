import axios from "axios";

const TOKEN_KEY = "token";
const USER_KEY = "user";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:5090/api";
const ASSET_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, "");

export const resolveAssetUrl = (value) => {
  if (!value) return "";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return `${ASSET_BASE_URL}${value}`;
  return `${ASSET_BASE_URL}/${value}`;
};

const redirectToLogin = () => {
  const currentPath = window.location.pathname;
  if (currentPath === "/login") return;

  window.location.assign("/login?session=expired");
};

export const createApiClient = (resourcePath) => {
  const instance = axios.create({
    baseURL: `${API_BASE_URL}${resourcePath}`,
  });

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error?.response?.status;
      const hasToken = Boolean(localStorage.getItem(TOKEN_KEY));

      if (status === 401 && hasToken) {
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        redirectToLogin();
      }

      return Promise.reject(error);
    }
  );

  return instance;
};
