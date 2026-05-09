/** HttpOnly-Session-Cookies für Google User-OAuth (nicht Drive/Gmail-Integration). */

function sessionCookieBase() {
  const secure = process.env.SESSION_COOKIE_SECURE === '1';
  const raw = String(process.env.SESSION_COOKIE_SAMESITE || 'lax').toLowerCase();
  const sameSite = raw === 'none' || raw === 'strict' ? raw : 'lax';
  return {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
  };
}

const ACCESS_COOKIE_MAX_AGE_MS = 55 * 60 * 1000;
const REFRESH_COOKIE_MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000;

module.exports = {
  sessionCookieBase,
  ACCESS_COOKIE_MAX_AGE_MS,
  REFRESH_COOKIE_MAX_AGE_MS,
};
