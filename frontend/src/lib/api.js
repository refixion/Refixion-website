import axios from "axios";

export const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://refixion-website.vercel.app";

export const API = `${BACKEND_URL}/api`;

console.log("BACKEND URL:", BACKEND_URL);
console.log("API URL:", API);

export const api = axios.create({
  baseURL: API,
  withCredentials: true,
});

// Attach token if stored
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("refixion_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export function formatApiErrorDetail(detail) {
  if (detail == null) return "Er ging iets mis. Probeer het opnieuw.";
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail))
    return detail.map((e) => (e && typeof e.msg === "string" ? e.msg : JSON.stringify(e))).join(" ");
  if (detail && typeof detail.msg === "string") return detail.msg;
  return String(detail);
}
