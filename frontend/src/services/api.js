import axios from 'axios';

const api = axios.create({
  baseURL: '',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dokuhero_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;
    const status = error?.response?.status;

    if (status !== 401 || !originalRequest || originalRequest._retry || originalRequest.url === '/api/auth/refresh') {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const refreshToken = localStorage.getItem('dokuhero_refresh_token');
      if (!refreshToken) {
        throw new Error('No refresh token');
      }

      const refreshResponse = await axios.post('/api/auth/refresh', {
        refresh_token: refreshToken,
      });

      const newAccessToken = refreshResponse?.data?.access_token;
      if (!newAccessToken) {
        throw new Error('Refresh did not return access token');
      }

      localStorage.setItem('dokuhero_token', newAccessToken);
      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      return api(originalRequest);
    } catch (refreshError) {
      localStorage.removeItem('dokuhero_token');
      localStorage.removeItem('dokuhero_refresh_token');
      window.location.href = '/babysit';
      return Promise.reject(refreshError);
    }
  }
);

export default api;
