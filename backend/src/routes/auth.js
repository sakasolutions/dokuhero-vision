const crypto = require('crypto');
const express = require('express');
const { google } = require('googleapis');

const supabaseService = require('../services/supabaseService');
const requireAuth = require('../middleware/auth');
const { resolveGoogleIdentity } = require('../utils/userIdentity');

const OAuth2Client = google.auth.OAuth2;

const router = express.Router();

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const SCOPES = [
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
];

const DRIVE_SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const GMAIL_SCOPES = ['https://www.googleapis.com/auth/gmail.readonly'];

function resolveGmailRedirectUri() {
  if (process.env.GOOGLE_GMAIL_REDIRECT_URI) {
    return process.env.GOOGLE_GMAIL_REDIRECT_URI;
  }
  const base = process.env.GOOGLE_REDIRECT_URI;
  if (base && typeof base === 'string') {
    return base.replace(/\/callback\/?$/i, '/gmail/callback');
  }
  return null;
}

const gmailRedirectUri = resolveGmailRedirectUri();

const oauth2GmailClient = gmailRedirectUri
  ? new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      gmailRedirectUri
    )
  : null;

function resolveDriveRedirectUri() {
  if (process.env.GOOGLE_DRIVE_REDIRECT_URI) {
    return process.env.GOOGLE_DRIVE_REDIRECT_URI;
  }
  const base = process.env.GOOGLE_REDIRECT_URI;
  if (base && typeof base === 'string') {
    return base.replace(/\/callback\/?$/i, '/drive/callback');
  }
  return null;
}

const driveRedirectUri = resolveDriveRedirectUri();

const oauth2DriveClient = driveRedirectUri
  ? new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      driveRedirectUri
    )
  : null;

function getOAuthStateSecret() {
  return process.env.OAUTH_STATE_SECRET || process.env.GOOGLE_CLIENT_SECRET;
}

function signOAuthState(payload) {
  const secret = getOAuthStateSecret();
  if (!secret) {
    throw new Error('OAuth state secret is not configured');
  }

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url');
  return `${encodedPayload}.${signature}`;
}

function verifyOAuthState(state) {
  const secret = getOAuthStateSecret();
  if (!secret || !state || typeof state !== 'string') {
    return null;
  }

  const [encodedPayload, providedSignature] = state.split('.');
  if (!encodedPayload || !providedSignature) {
    return null;
  }

  const expectedSignature = crypto.createHmac('sha256', secret).update(encodedPayload).digest('base64url');
  if (providedSignature !== expectedSignature) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    if (!payload || payload.type !== 'drive' || !payload.userId) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

router.get('/google', (_req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  });

  res.redirect(authUrl);
});

/** Separater OAuth-Flow nur für Gmail (gmail.readonly). Callback legt Tokens in der Settings-URL ab. */
router.get('/gmail', (_req, res) => {
  if (!oauth2GmailClient || !gmailRedirectUri) {
    return res.status(500).json({
      success: false,
      error:
        'Gmail-OAuth nicht konfiguriert: GOOGLE_GMAIL_REDIRECT_URI setzen oder GOOGLE_REDIRECT_URI auf …/api/auth/callback anpassen (…/gmail/callback wird abgeleitet).',
    });
  }

  const authUrl = oauth2GmailClient.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: GMAIL_SCOPES,
    include_granted_scopes: true,
  });

  res.redirect(authUrl);
});

router.get('/gmail/callback', async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (!oauth2GmailClient) {
    return res.redirect(`${frontendUrl}/settings?gmail=error`);
  }

  try {
    const { code } = req.query;

    if (!code) {
      return res.redirect(`${frontendUrl}/settings?gmail=error`);
    }

    const { tokens } = await oauth2GmailClient.getToken(code);
    oauth2GmailClient.setCredentials(tokens);

    if (!tokens.access_token) {
      return res.redirect(`${frontendUrl}/settings?gmail=error`);
    }

    const target = new URL(`${frontendUrl.replace(/\/$/, '')}/settings`);
    target.searchParams.set('gmail', 'connected');
    target.searchParams.set('gmail_token', tokens.access_token);
    if (tokens.refresh_token) {
      target.searchParams.set('gmail_refresh', tokens.refresh_token);
    }

    return res.redirect(target.toString());
  } catch {
    return res.redirect(`${frontendUrl}/settings?gmail=error`);
  }
});

router.post('/drive-url', requireAuth, (req, res) => {
  if (!oauth2DriveClient || !driveRedirectUri) {
    return res.status(500).json({
      success: false,
      error: 'Drive-OAuth nicht konfiguriert (GOOGLE_DRIVE_REDIRECT_URI oder GOOGLE_REDIRECT_URI).',
    });
  }

  if (!req.userId) {
    return res.status(401).json({ success: false, error: 'Nicht authentifiziert' });
  }

  const state = signOAuthState({
    type: 'drive',
    userId: req.userId,
    createdAt: Date.now(),
  });

  const authUrl = oauth2DriveClient.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: DRIVE_SCOPES,
    include_granted_scopes: true,
    state,
  });

  return res.json({ success: true, authUrl });
});

router.get('/drive/callback', async (req, res) => {
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  if (!oauth2DriveClient) {
    return res.redirect(`${frontendUrl}/settings?drive=error`);
  }

  try {
    const { code, state } = req.query;
    const verifiedState = verifyOAuthState(state);
    const userId = String(verifiedState?.userId || '').trim();

    if (!code || !userId) {
      return res.redirect(`${frontendUrl}/settings?drive=error`);
    }

    const { tokens } = await oauth2DriveClient.getToken(code);
    oauth2DriveClient.setCredentials(tokens);

    if (!tokens?.access_token) {
      return res.redirect(`${frontendUrl}/settings?drive=error`);
    }

    await supabaseService.updateDriveTokens(userId, tokens);
    const params = new URLSearchParams();
    params.set('drive', 'connected');
    params.set('drive_token', tokens.access_token);
    return res.redirect(`${frontendUrl}/settings?${params.toString()}`);
  } catch (err) {
    console.error('[auth/drive/callback]', err?.message || err);
    return res.redirect(`${frontendUrl}/settings?drive=error`);
  }
});

router.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;

    if (!code) {
      return res.status(400).json({ success: false, error: 'Missing code parameter' });
    }

    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    if (!tokens.access_token) {
      return res.status(500).json({ success: false, error: 'No access token returned by Google' });
    }

    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const { data: user } = await oauth2.userinfo.get();

    const { userId } = resolveGoogleIdentity(user);

    try {
      await supabaseService.upsertUser({
        id: userId,
        email: user?.email || null,
        name: user?.name || null,
        avatar_url: user?.picture || null,
      });
    } catch (err) {
      console.error('[auth/callback] Supabase upsertUser:', err?.message || err);
    }

    const params = new URLSearchParams();
    params.set('access_token', tokens.access_token);
    if (tokens.refresh_token) {
      params.set('refresh_token', tokens.refresh_token);
    }
    const redirectUrl = `${process.env.FRONTEND_URL}/upload?${params.toString()}`;
    return res.redirect(redirectUrl);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'OAuth callback failed',
    });
  }
});

router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token: refreshToken } = req.body || {};

    if (!refreshToken) {
      return res.status(400).json({ success: false, error: 'Missing refresh_token' });
    }

    const refreshClient = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    refreshClient.setCredentials({ refresh_token: refreshToken });
    const tokenResponse = await refreshClient.getAccessToken();
    const newAccessToken = tokenResponse?.token;

    if (!newAccessToken) {
      return res.status(500).json({ success: false, error: 'Could not refresh access token' });
    }

    return res.json({
      success: true,
      access_token: newAccessToken,
      expiry_date: refreshClient.credentials?.expiry_date || null,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'Token refresh failed',
    });
  }
});

router.get('/logout', (_req, res) => {
  res.json({ success: true, message: 'Logged out' });
});

module.exports = router;
