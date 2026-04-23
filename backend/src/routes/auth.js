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

    const redirectUrl = `http://localhost:5173/upload?access_token=${encodeURIComponent(tokens.access_token)}`;
    return res.redirect(redirectUrl);
  } catch (error) {
    return res.status(500).json({
      success: false,
      error: error.message || 'OAuth callback failed',
    });
  }
});

router.get('/logout', (_req, res) => {
  res.json({ success: true, message: 'Logged out' });
});

module.exports = router;
