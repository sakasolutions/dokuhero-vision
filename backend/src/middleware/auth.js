const { google } = require('googleapis');

const supabaseService = require('../services/supabaseService');

/** Gleiche Logik wie auth-Routen: Drive-Consent nutzt oft …/drive/callback — Refresh muss dieselbe Client-Redirect-URI nutzen. */
function resolveDriveOAuthRedirectUri() {
  if (process.env.GOOGLE_DRIVE_REDIRECT_URI) {
    return process.env.GOOGLE_DRIVE_REDIRECT_URI;
  }
  const base = process.env.GOOGLE_REDIRECT_URI;
  if (base && typeof base === 'string') {
    return base.replace(/\/callback\/?$/i, '/drive/callback');
  }
  return process.env.GOOGLE_REDIRECT_URI;
}

/**
 * @param {string} refreshToken
 * @returns {Promise<import('google-auth-library').Credentials>}
 */
async function refreshDriveToken(refreshToken) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    resolveDriveOAuthRedirectUri()
  );
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  const { credentials } = await oauth2Client.refreshAccessToken();
  return credentials;
}

/**
 * @param {string} accessToken
 * @returns {Promise<boolean>}
 */
async function isDriveAccessTokenValid(accessToken) {
  if (!accessToken || typeof accessToken !== 'string') {
    return false;
  }
  try {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    const drive = google.drive({ version: 'v3', auth });
    await drive.about.get({ fields: 'user' });
    return true;
  } catch {
    return false;
  }
}

/**
 * Lädt Drive-Access-Token aus Supabase, prüft Gültigkeit per Drive API, refresht bei Bedarf.
 * Ignoriert x-drive-token — nur serverseitige Tokens.
 *
 * @param {import('express').Request} req
 */
async function resolveDriveTokenFromSupabase(req) {
  req.driveToken = null;
  req.storageProvider = null;

  const userId = req.userId;
  if (!userId) {
    return;
  }

  try {
    const user = await supabaseService.getUser(userId);
    if (!user) {
      return;
    }

    req.storageProvider = user.storage_provider ?? null;

    const access = user.drive_access_token ? String(user.drive_access_token).trim() : '';
    const refresh = user.drive_refresh_token ? String(user.drive_refresh_token).trim() : '';

    if (!access && !refresh) {
      return;
    }

    if (access && (await isDriveAccessTokenValid(access))) {
      req.driveToken = access;
      return;
    }

    if (!refresh) {
      return;
    }

    const credentials = await refreshDriveToken(refresh);
    if (!credentials?.access_token) {
      return;
    }

    await supabaseService.updateDriveTokens(userId, {
      access_token: credentials.access_token,
      refresh_token: credentials.refresh_token || refresh,
    });
    req.driveToken = credentials.access_token;
  } catch (err) {
    console.error('[requireAuth] resolveDriveTokenFromSupabase:', err?.message || err);
    req.driveToken = null;
  }
}

function readUserIdFromHeader(req) {
  const raw = req.headers['x-user-id'];
  return typeof raw === 'string' ? raw.trim() || null : null;
}

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
    req.userId = readUserIdFromHeader(req);
    await resolveDriveTokenFromSupabase(req);
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
      req.userId = readUserIdFromHeader(req);

      res.setHeader('x-new-token', credentials.access_token);
      if (credentials.expiry_date) {
        res.setHeader('x-new-expiry', String(credentials.expiry_date));
      }

      await resolveDriveTokenFromSupabase(req);
      return next();
    } catch (_refreshErr) {
      return res.status(401).json({ error: 'Refresh fehlgeschlagen', code: 'REFRESH_FAILED' });
    }
  }
}

module.exports = requireAuth;
