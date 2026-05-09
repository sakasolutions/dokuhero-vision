const crypto = require('crypto');

const TTL_MS = Number(process.env.LOGIN_EXCHANGE_TTL_MS) || 120_000;
const store = new Map();

function sweep() {
  const now = Date.now();
  for (const [k, v] of store) {
    if (now - v.createdAt > TTL_MS) store.delete(k);
  }
}

/**
 * Einmalige OAuth-Zwischenspeicherung: Kurzlebiger Code → Tokens (nur Server).
 * @param {{ access_token: string, refresh_token?: string|null, expiry_date?: number|null }} tokens
 * @returns {string}
 */
function put(tokens) {
  sweep();
  const id = crypto.randomBytes(24).toString('hex');
  store.set(id, {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token || null,
    expiry_date: tokens.expiry_date ?? null,
    createdAt: Date.now(),
  });
  return id;
}

/** Holt und löscht Eintrag (einmalig konsumierbar). */
function take(id) {
  if (!id || typeof id !== 'string') return null;
  sweep();
  const v = store.get(id);
  store.delete(id);
  if (!v || Date.now() - v.createdAt > TTL_MS) return null;
  return v;
}

module.exports = { put, take };
