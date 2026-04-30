import axios from 'axios';

const api = axios.create({
  baseURL: '',
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
  const userId = localStorage.getItem('dokuhero_user_id');
  if (userId) {
    config.headers['x-user-id'] = userId;
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
      localStorage.removeItem('dokuhero_user_id');
      window.location.href = '/babysit';
    }
    return Promise.reject(error);
  }
);

export default api;
