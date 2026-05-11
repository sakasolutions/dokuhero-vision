import api from '../services/api';

const RETRY_DELAY_MS = 2000;

function isNetworkError(error) {
  return (
    error?.code === 'ERR_NETWORK' ||
    error?.code === 'ECONNABORTED' ||
    error?.response == null
  );
}

function sleep(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

async function fetchUserMe() {
  const lsToken = localStorage.getItem('dokuhero_token');
  return api.get('/api/user/me', {
    validateStatus: (s) => s === 200 || s === 401,
    headers: lsToken ? { Authorization: `Bearer ${lsToken}` } : {},
  });
}

/**
 * Einmal Retry nach Netzwerkfehler; gibt Response oder wirft den letzten Fehler.
 */
async function fetchUserMeWithNetworkRetry() {
  try {
    return await fetchUserMe();
  } catch (err) {
    if (!isNetworkError(err)) {
      throw err;
    }
    await sleep(RETRY_DELAY_MS);
    return fetchUserMe();
  }
}

/** Prüft, ob ein gültiger User-Kontext existiert (Bearer in LS oder HttpOnly dh_* Cookies). */
export async function ensureSessionOrRedirect(navigate) {
  let r;
  try {
    r = await fetchUserMeWithNetworkRetry();
  } catch (error) {
    if (isNetworkError(error)) {
      return true;
    }
    navigate('/');
    return false;
  }

  if (r.status === 200 && r.data?.success) {
    return true;
  }
  if (r.data?.code === 'REFRESH_FAILED') {
    navigate('/');
    return false;
  }
  return true;
}

/** Nur Prüfung — für Login-Seite (Redirect nach /upload wenn schon eingeloggt). */
export async function probeBackendSession() {
  let r;
  try {
    r = await fetchUserMeWithNetworkRetry();
  } catch (error) {
    if (isNetworkError(error)) {
      return true;
    }
    return false;
  }

  return r.status === 200 && r.data?.success === true;
}

export async function clearClientSession() {
  localStorage.removeItem('dokuhero_token');
  localStorage.removeItem('dokuhero_refresh_token');
  localStorage.removeItem('dokuhero_token_expiry');
  try {
    await api.post('/api/auth/session-clear', {}, { withCredentials: true });
  } catch {
    /* Cookies sind ohnehin nicht kritisch, wenn der Tab geschlossen wird */
  }
}
