import axios from 'axios';

const api = axios.create({
  // Wrapper-ready: in Capacitor/Apps ist die Origin NICHT euer Backend.
  // Default bleibt wie bisher (same-origin), wenn keine Env gesetzt ist.
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  config.headers = config.headers || {};
  const existingAuth = config.headers.Authorization;
  if (existingAuth == null || String(existingAuth).trim() === '') {
    const token = localStorage.getItem('dokuhero_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  const refreshToken = localStorage.getItem('dokuhero_refresh_token');
  if (refreshToken) {
    config.headers['x-refresh-token'] = refreshToken;
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    const newToken = response?.headers?.['x-new-token'];
    const newExpiry = response?.headers?.['x-new-expiry'];
    if (newToken) {
      localStorage.setItem('dokuhero_token', newToken);
      if (newExpiry) {
        localStorage.setItem('dokuhero_token_expiry', newExpiry);
      }
    }
    return response;
  },
  async (error) => {
    const code = error?.response?.data?.code;
    if (code === 'REFRESH_FAILED') {
      localStorage.removeItem('dokuhero_token');
      localStorage.removeItem('dokuhero_refresh_token');
      localStorage.removeItem('dokuhero_token_expiry');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export default api;
