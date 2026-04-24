import axios from 'axios';

const api = axios.create({
  baseURL: '',
});

/** Gemeinsames Refresh-Promise bei parallelen 401 */
let refreshInFlight = null;

function isAuthRefreshRequest(config) {
  const url = config?.url || '';
  return url.includes('/api/auth/refresh');
}

async function performTokenRefresh() {
  const refreshToken = localStorage.getItem('dokuhero_refresh_token');
  if (!refreshToken) {
    window.location.href = '/';
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
  return newAccessToken;
}

api.interceptors.request.use((config) => {
  const existing = config.headers?.Authorization;
  if (existing != null && String(existing).trim() !== '') {
    return config;
  }
  const token = localStorage.getItem('dokuhero_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error?.config;
    const status = error?.response?.status;

    if (status !== 401 || !originalRequest || originalRequest._retry || isAuthRefreshRequest(originalRequest)) {
      return Promise.reject(error);
    }

    const reqUrl = String(originalRequest.url || '');
    if (reqUrl.includes('/api/gmail/inbox')) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshInFlight) {
        refreshInFlight = performTokenRefresh().finally(() => {
          refreshInFlight = null;
        });
      }
      const newAccessToken = await refreshInFlight;

      originalRequest.headers = originalRequest.headers || {};
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

      return api(originalRequest);
    } catch {
      localStorage.removeItem('dokuhero_token');
      localStorage.removeItem('dokuhero_refresh_token');
      window.location.href = '/';
      return Promise.reject(error);
    }
  }
);

export default api;
