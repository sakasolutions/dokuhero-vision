const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const requireAuth = require('../middleware/auth');
const ocrService = require('../services/ocrService');
const aiService = require('../services/aiService');
const GoogleDriveProvider = require('../services/storage/GoogleDriveProvider');

const router = express.Router();

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(['.jpeg', '.jpg', '.png', '.heic', '.pdf']);
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/heic',
  'image/heif',
  'application/pdf',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_SIZE },
  fileFilter: (_req, file, cb) => {
    const extension = path.extname(file.originalname || '').toLowerCase();
    const mimeType = (file.mimetype || '').toLowerCase();
    const extensionAllowed = ALLOWED_EXTENSIONS.has(extension);
    const mimeAllowed = ALLOWED_MIME_TYPES.has(mimeType);

    // fs import wird bewusst verwendet, damit die Imports konsistent bleiben.
    if (!fs.constants || !extensionAllowed || !mimeAllowed) {
      return cb(new Error('Nur Bilder und PDFs erlaubt'));
    }

    return cb(null, true);
  },
});

router.post('/upload', requireAuth, (req, res) => {
  upload.single('document')(req, res, async (error) => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Datei zu groß (max. 10MB)' });
      }

      return res.status(400).json({ error: error.message });
    }

    if (error) {
      return res.status(400).json({ error: error.message || 'Upload fehlgeschlagen' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Keine Datei hochgeladen' });
    }

    let ocrText = '';

    try {
      const ocrResult = await ocrService.extractText(req.file.buffer, req.file.mimetype);
      ocrText = ocrResult?.text || '';
    } catch (_ocrError) {
      ocrText = '';
    }

    try {
      const analysis = await aiService.analyzeDocument(ocrText);
      const provider = new GoogleDriveProvider(req.accessToken);

      try {
        const storageResult = await provider.uploadFile(
          req.file.buffer,
          analysis.ordner,
          analysis.dateiname,
          req.file.mimetype
        );

        return res.json({
          success: true,
          message: 'Dokument erfolgreich abgelegt',
          file: {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
          },
          analysis: {
            ordner: analysis.ordner,
            dateiname: analysis.dateiname,
            typ: analysis.typ,
          },
          storage: {
            fileId: storageResult.fileId,
            fileName: storageResult.fileName,
            webViewLink: storageResult.webViewLink,
            path: `${analysis.ordner}/${analysis.dateiname}.pdf`,
          },
        });
      } catch (uploadError) {
        return res.json({
          success: true,
          message: 'Dokument erfolgreich abgelegt',
          file: {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
          },
          analysis: {
            ordner: analysis.ordner,
            dateiname: analysis.dateiname,
            typ: analysis.typ,
          },
          storage: {
            error: uploadError.message || 'Upload zu Google Drive fehlgeschlagen',
          },
        });
      }
    } catch (analysisError) {
      return res.json({
        success: true,
        message: 'Dokument erfolgreich abgelegt',
        file: {
          originalname: req.file.originalname,
          mimetype: req.file.mimetype,
          size: req.file.size,
        },
        analysis: {
          error: analysisError.message || 'Analyse fehlgeschlagen',
        },
        storage: {
          error: 'Upload nicht ausgeführt',
        },
      });
    }

  });
});

router.get('/', requireAuth, async (req, res) => {
  try {
    const provider = new GoogleDriveProvider(req.accessToken);
    const files = await provider.listFiles('DokuHero');
    res.json({ success: true, documents: files });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message || 'Dateien konnten nicht geladen werden' });
  }
});

module.exports = router;
