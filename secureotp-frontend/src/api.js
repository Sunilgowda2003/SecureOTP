
import axios from "axios";

const api = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:8080/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 60000,
  withCredentials: true,
  withXSRFToken: true,
});

// Prevent multiple simultaneous refresh requests.
let refreshPromise = null;

const AUTH_PREFIX = "/auth/";

function isAuthEndpoint(url = "") {
  return url.includes(AUTH_PREFIX);
}

// Clear authentication when refresh fails.
function clearStoredAuthentication() {
  sessionStorage.removeItem("accessToken");
  sessionStorage.removeItem("user");

  window.dispatchEvent(
    new Event("secureotp:session-expired")
  );
}

// Attach access JWT to outgoing requests.
api.interceptors.request.use(
  (config) => {
    const token = sessionStorage.getItem("accessToken");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Remember which token was used for this request.
    config._accessTokenUsed = token;

    return config;
  },
  (error) => Promise.reject(error)
);

// Obtain CSRF cookie.
export const getCsrfToken = () =>
  api.get("/auth/csrf");

// Refresh access JWT using the HttpOnly refresh cookie.
async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      await getCsrfToken();

      const response = await api.post("/auth/refresh");

      const newToken = response.data.accessToken;

      if (!newToken) {
        throw new Error(
          "Refresh response did not contain an access token."
        );
      }

      sessionStorage.setItem("accessToken", newToken);

      window.dispatchEvent(
        new Event("secureotp:token-updated")
      );

      return newToken;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

// Automatically refresh and retry protected requests.
api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      isAuthEndpoint(originalRequest.url) ||
      !originalRequest._accessTokenUsed
    ) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    const currentToken =
      sessionStorage.getItem("accessToken");

    // Another request may already have refreshed the token.
    if (
      currentToken &&
      currentToken !== originalRequest._accessTokenUsed
    ) {
      originalRequest.headers =
        originalRequest.headers || {};

      originalRequest.headers.Authorization =
        `Bearer ${currentToken}`;

      return api(originalRequest);
    }

    try {
      const newToken = await refreshAccessToken();

      originalRequest.headers =
        originalRequest.headers || {};

      originalRequest.headers.Authorization =
        `Bearer ${newToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      clearStoredAuthentication();

      return Promise.reject(refreshError);
    }
  }
);

// Registration
export const registerRequest = (data) =>
  api.post("/auth/register/request-otp", data);

export const registerVerify = (data) =>
  api.post("/auth/register/verify", data);

// Login
export const loginRequest = (data) =>
  api.post("/auth/login/request-otp", data);

export const loginVerify = (data) =>
  api.post("/auth/login/verify", data);

// Password reset
export const forgotPassword = (data) =>
  api.post("/auth/password/forgot", data);

export const resetPassword = (data) =>
  api.post("/auth/password/reset", data);

// Protected profile
export const getUserProfile = () =>
  api.get("/user/profile");

// Logout
export const logoutRequest = async () => {
  await getCsrfToken();
  return api.post("/auth/logout");
};

export default api;
