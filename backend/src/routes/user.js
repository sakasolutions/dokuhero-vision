const express = require('express');

const requireAuth = require('../middleware/auth');
const supabaseService = require('../services/supabaseService');

const router = express.Router();

// POST /api/user/storage-provider
router.post('/storage-provider', requireAuth, async (req, res) => {
  try {
    const { provider } = req.body || {};
    if (!['hetzner', 'google_drive'].includes(provider)) {
      return res.status(400).json({ error: 'Ungültiger Provider' });
    }
    if (!req.userId) {
      return res.status(400).json({ error: 'User-ID fehlt' });
    }

    await supabaseService.updateStorageProvider(req.userId, provider);
    return res.json({ success: true, provider });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/user/me
router.get('/me', requireAuth, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(400).json({ error: 'User-ID fehlt' });
    }
    const user = await supabaseService.getUser(req.userId);
    return res.json({ success: true, user });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
