const crypto = require('crypto');

const TTL_MS = Number(process.env.GMAIL_EXCHANGE_TTL_MS) || 120_000;
const store = new Map();

function sweep() {
  const now = Date.now();
  for (const [k, v] of store) {
    if (now - v.createdAt > TTL_MS) store.delete(k);
  }
}

/**
 * Gmail-OAuth: einmaliger Code → Access/Refresh (nur Server), kein Token in der Redirect-URL.
 * @param {{ access_token: string, refresh_token?: string|null }} tokens
 * @returns {string}
 */
function put(tokens) {
  sweep();
  const id = crypto.randomBytes(24).toString('hex');
  store.set(id, {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token || null,
    createdAt: Date.now(),
  });
  return id;
}

function take(id) {
  if (!id || typeof id !== 'string') return null;
  sweep();
  const v = store.get(id);
  store.delete(id);
  if (!v || Date.now() - v.createdAt > TTL_MS) return null;
  return v;
}

module.exports = { put, take };
