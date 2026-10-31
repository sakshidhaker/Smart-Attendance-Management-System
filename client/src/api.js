import axios from "axios";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api" });

// attach the JWT to every request
api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

// if the token has expired, send the user back to the login page
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

// the server's message, or a friendly fallback
export const errorMessage = (err, fallback = "Something went wrong") =>
  err.response?.data?.message || (err.request ? "Could not connect to the server" : fallback);

export default api;
