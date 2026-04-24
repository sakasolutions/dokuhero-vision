const express = require('express');

const requireAuth = require('../middleware/auth');
const { requireGmailBearer, attachGmailAccessFromHeader } = require('../middleware/gmailAuth');
const gmailService = require('../services/gmailService');
const ocrService = require('../services/ocrService');
const aiService = require('../services/aiService');
const GoogleDriveProvider = require('../services/storage/GoogleDriveProvider');

const router = express.Router();

router.get('/inbox', requireGmailBearer, async (req, res) => {
  try {
    const emails = await gmailService.getEmailsWithPdfAttachments(req.gmailAccessToken);
    res.json({ success: true, emails });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'Gmail konnte nicht geladen werden' });
  }
});

router.post('/process', requireAuth, attachGmailAccessFromHeader, async (req, res) => {
  try {
    const { messageId, attachmentId, filename } = req.body || {};

    if (!messageId || !attachmentId) {
      return res.status(400).json({ success: false, error: 'messageId und attachmentId sind erforderlich' });
    }

    const pdfBuffer = await gmailService.downloadAttachment(req.gmailAccessToken, messageId, attachmentId);

    const ocr = await ocrService.extractText(pdfBuffer, 'application/pdf');
    const analysis = await aiService.analyzeDocument(ocr.text || '');

    const provider = new GoogleDriveProvider(req.accessToken);
    const result = await provider.uploadFile(
      pdfBuffer,
      analysis.ordner,
      analysis.dateiname,
      'application/pdf',
      false
    );

    res.json({
      success: true,
      message: 'Dokument aus Mail abgelegt',
      analysis: {
        ordner: analysis.ordner,
        dateiname: analysis.dateiname,
        typ: analysis.typ,
      },
      storage: result,
      filename: filename || null,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'Verarbeitung fehlgeschlagen' });
  }
});

module.exports = router;
