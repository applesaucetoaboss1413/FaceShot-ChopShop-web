import axios from "axios";

const api = axios.create({
  baseURL:
    process.env.NODE_ENV === "production"
      ? ""
      : process.env.REACT_APP_BACKEND_URL || "http://localhost:3000",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const signup = (email, password) =>
  api.post("/api/auth/signup", { email, password });
export const login = (email, password) =>
  api.post("/api/auth/login", { email, password });
export const getMe = () => api.get("/api/auth/me");

export const getPacks = () => api.get("/api/web/packs");
export const getCatalog = () => api.get("/api/web/catalog");
export const getStats = () => api.get("/stats");
export const createCheckoutSession = (packType) =>
  api.post("/api/web/checkout", { pack_type: packType });
export const getCredits = () => api.get("/api/web/credits");
export const getCreations = () => api.get("/api/web/creations");
export const uploadFile = (file, type) => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);
  return api.post("/api/web/upload", formData);
};
export const processJob = (type, options = {}) => api.post("/api/web/process", { type, ...options });
export const getJobStatus = (id) => api.get(`/api/web/status?id=${id}`);

export default api;
