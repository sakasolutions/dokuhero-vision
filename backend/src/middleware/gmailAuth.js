/**
 * Bearer-Token aus Authorization — nur für Gmail-API (kein Drive-Scope).
 */
function requireGmailBearer(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Gmail-Token fehlt (Authorization: Bearer).' });
  }

  req.gmailAccessToken = authHeader.split(' ')[1];
  return next();
}

/**
 * Gmail-Download-Token aus Header; Drive nutzt weiter req.accessToken (requireAuth).
 */
function attachGmailAccessFromHeader(req, res, next) {
  const raw = req.headers['x-gmail-access-token'];
  if (!raw) {
    return res.status(400).json({
      success: false,
      error: 'X-Gmail-Access-Token fehlt (Gmail für Anhänge verbinden).',
    });
  }

  const token = String(raw).replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return res.status(400).json({ success: false, error: 'Ungültiges Gmail-Token.' });
  }

  req.gmailAccessToken = token;
  return next();
}

module.exports = { requireGmailBearer, attachGmailAccessFromHeader };
