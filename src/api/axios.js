import axios from "axios";

const API_TIMEOUT_MS = 8_000;

const toApiBaseUrl = (url) => {
  if (!url) return undefined;

  const normalizedUrl = url.replace(/\/+$/, "");
  return normalizedUrl.endsWith("/api")
    ? normalizedUrl
    : `${normalizedUrl}/api`;
};

const baseURL = toApiBaseUrl(import.meta.env.API_URL);

if (!baseURL) {
  throw new Error("API_URL must be configured before starting the app.");
}

const axiosInstance = axios.create({
  baseURL,
  timeout: API_TIMEOUT_MS,
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default axiosInstance;
