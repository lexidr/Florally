import axios from "axios";

export const API: string =
  (import.meta as any).env.VITE_API_URL || "http://188.225.11.37:3000";

export const Http = axios.create({
  baseURL: API,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

Http.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers["Authorization"] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
