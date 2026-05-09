const rateLimit = require('express-rate-limit');

const minute = 60 * 1000;

/** Alle Auth-Routen (OAuth-Redirects, Callbacks, Refresh) — pro IP. */
const authRoutesLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_AUTH_WINDOW_MS) || 15 * minute,
  max: Number(process.env.RATE_LIMIT_AUTH_MAX) || 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Zu viele Anfragen. Bitte später erneut versuchen.' },
});

/** POST /exchange-login — Codes erraten / Replay erschweren. */
const exchangeLoginLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_EXCHANGE_WINDOW_MS) || 15 * minute,
  max: Number(process.env.RATE_LIMIT_EXCHANGE_MAX) || 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Zu viele Anfragen. Bitte später erneut versuchen.' },
});

/** Nur POST /refresh — strenger, Missbrauch mit geleakten Refresh-Tokens erschweren. */
const authRefreshLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_REFRESH_WINDOW_MS) || 60 * minute,
  max: Number(process.env.RATE_LIMIT_REFRESH_MAX) || 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Zu viele Token-Erneuerungen. Bitte später erneut versuchen.' },
});

module.exports = {
  authRoutesLimiter,
  authRefreshLimiter,
  exchangeLoginLimiter,
};
