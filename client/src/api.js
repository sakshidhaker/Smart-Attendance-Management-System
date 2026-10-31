import axios from "axios";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api" });

// har request me token khud lag jata hai
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// token expire ho gaya to login pe bhej do
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const path = window.location.pathname;
    const onAuthPage = path.startsWith("/login") || path.startsWith("/register");
    if (err.response?.status === 401 && !onAuthPage) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// server ka message ya friendly fallback
export const errorMessage = (err, fallback = "Something went wrong") =>
  err.response?.data?.message || (err.request ? "Server se connect nahi ho paaya" : fallback);

export default api;
