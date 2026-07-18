import axios from "axios";
import { deleteCookie } from "cookies-next";

// 1. Create the Axios instance with your Backend URL.
// Using the versioned /api/v1 prefix -- see backend CHANGELOG.md. The backend still
// accepts the old unversioned /api/* paths during the deprecation window, but new
// frontend code should always go through /v1.
const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL + "/api",

  headers: {
    "Content-Type": "application/json",
  },
});

// 2. Request Interceptor: attach the JWT, if we have one
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. Response Interceptor: centralize "your session died" handling.
// A 401 here always means the JWT is missing/invalid/expired -- the backend's
// AuthEntryPointJwt returns 401 before any request even reaches a controller. There's
// no point letting each component figure that out separately.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && typeof window !== "undefined") {
      const isAuthRoute = window.location.pathname === "/login" || window.location.pathname === "/signup";
      if (!isAuthRoute) {
        localStorage.clear();
        deleteCookie("token");
        window.location.href = "/login?sessionExpired=1";
      }
    }
    return Promise.reject(error);
  }
);

export default api;
