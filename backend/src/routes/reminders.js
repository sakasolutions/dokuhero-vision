const express = require('express');

const router = express.Router();
const requireAuth = require('../middleware/auth');
const supabaseService = require('../services/supabaseService');

// POST /api/reminders — Erinnerung erstellen
router.post('/', requireAuth, async (req, res) => {
  try {
    const { document_id, due_date, title } = req.body;
    const reminder = await supabaseService.createReminder({
      user_id: req.userId,
      document_id,
      due_date,
      title,
    });
    res.json({ success: true, reminder });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/reminders — Alle Erinnerungen des Users
router.get('/', requireAuth, async (req, res) => {
  try {
    const reminders = await supabaseService.getUserReminders(req.userId);
    res.json({ success: true, reminders });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
