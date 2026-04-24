const express = require('express');
const { google } = require('googleapis');

const OAuth2Client = google.auth.OAuth2;

const router = express.Router();

const oauth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

const SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
  'https://www.googleapis.com/auth/gmail.readonly',
];

router.get('/google', (_req, res) => {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: SCOPES,
  });

  res.redirect(authUrl);
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
