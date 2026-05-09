import api from '../services/api';

/** Prüft, ob ein gültiger User-Kontext existiert (Bearer in LS oder HttpOnly dh_* Cookies). */
export async function ensureSessionOrRedirect(navigate) {
  const lsToken = localStorage.getItem('dokuhero_token');
  try {
    const r = await api.get('/api/user/me', {
      validateStatus: (s) => s === 200 || s === 401,
      headers: lsToken ? { Authorization: `Bearer ${lsToken}` } : {},
    });
    if (r.status !== 200 || !r.data?.success) {
      navigate('/');
      return false;
    }
    return true;
  } catch {
    navigate('/');
    return false;
  }
}

/** Nur Prüfung — für Login-Seite (Redirect nach /upload wenn schon eingeloggt). */
export async function probeBackendSession() {
  const lsToken = localStorage.getItem('dokuhero_token');
  try {
    const r = await api.get('/api/user/me', {
      validateStatus: (s) => s === 200 || s === 401,
      headers: lsToken ? { Authorization: `Bearer ${lsToken}` } : {},
    });
    return r.status === 200 && r.data?.success === true;
  } catch {
    return false;
  }
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
