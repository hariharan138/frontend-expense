import axios from "axios";

const API_TIMEOUT_MS = 8_000;

const toApiBaseUrl = (url) => {
  if (!url) return undefined;

  const normalizedUrl = url.replace(/\/+$/, "");
  return normalizedUrl.endsWith("/api")
    ? normalizedUrl
    : `${normalizedUrl}/api`;
};

const primaryBaseURL = toApiBaseUrl(import.meta.env.PRIMARY_API_URL);
const secondaryBaseURL = toApiBaseUrl(import.meta.env.SECONDARY_API_URL);

if (!primaryBaseURL || !secondaryBaseURL) {
  throw new Error(
    "PRIMARY_API_URL and SECONDARY_API_URL must be configured before starting the app.",
  );
}

const axiosInstance = axios.create({
  baseURL: primaryBaseURL,
  timeout: API_TIMEOUT_MS,
});

axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token") || sessionStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const shouldTrySecondary = (error) => {
  if (error.code === "ERR_CANCELED") return false;

  // Axios has no response for connection, DNS, CORS, and timeout failures.
  if (!error.response) return true;

  return error.response.status >= 500 && error.response.status <= 599;
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;

    if (
      !config ||
      config.__secondaryAttempted ||
      !secondaryBaseURL ||
      !shouldTrySecondary(error)
    ) {
      return Promise.reject(error);
    }

    config.__secondaryAttempted = true;
    config.baseURL = secondaryBaseURL;

    if (import.meta.env.DEV) {
      console.warn("Primary API failed, switching to secondary");
    }

    try {
      const response = await axiosInstance(config);

      if (import.meta.env.DEV) {
        console.info("Secondary API request successful");
      }

      return response;
    } catch (secondaryError) {
      return Promise.reject(secondaryError);
    }
  },
);

export default axiosInstance;
