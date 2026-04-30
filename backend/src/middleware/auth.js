const { google } = require('googleapis');

async function requireAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '').trim();

  if (!token) {
    return res.status(401).json({ error: 'Kein Token' });
  }

  try {
    const oauth2 = google.oauth2('v2');
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: token });

    await oauth2.userinfo.get({ auth });
    req.accessToken = token;
    req.userId = typeof req.headers['x-user-id'] === 'string' ? req.headers['x-user-id'] : null;
    return next();
  } catch (_err) {
    const refreshToken = req.headers['x-refresh-token'];

    if (!refreshToken) {
      return res.status(401).json({ error: 'Token abgelaufen', code: 'TOKEN_EXPIRED' });
    }

    try {
      const oauth2Client = new google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
      oauth2Client.setCredentials({ refresh_token: String(refreshToken).trim() });

      const { credentials } = await oauth2Client.refreshAccessToken();
      if (!credentials?.access_token) {
        return res.status(401).json({ error: 'Refresh fehlgeschlagen', code: 'REFRESH_FAILED' });
      }

      req.accessToken = credentials.access_token;
      req.userId = typeof req.headers['x-user-id'] === 'string' ? req.headers['x-user-id'] : null;

      res.setHeader('x-new-token', credentials.access_token);
      if (credentials.expiry_date) {
        res.setHeader('x-new-expiry', String(credentials.expiry_date));
      }

      return next();
    } catch (_refreshErr) {
      return res.status(401).json({ error: 'Refresh fehlgeschlagen', code: 'REFRESH_FAILED' });
    }
  }
}

module.exports = requireAuth;
