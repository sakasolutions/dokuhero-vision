const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { PDFDocument } = require('pdf-lib');

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

    if (!fs.constants || !extensionAllowed || !mimeAllowed) {
      return cb(new Error('Nur Bilder und PDFs erlaubt'));
    }

    return cb(null, true);
  },
});

const uploadFields = upload.fields([
  { name: 'document', maxCount: 1 },
  { name: 'pages', maxCount: 10 },
]);

/**
 * @param {Buffer[]} buffers
 * @returns {Promise<Buffer>}
 */
async function mergePdfBuffers(buffers) {
  const merged = await PDFDocument.create();
  for (const buf of buffers) {
    const src = await PDFDocument.load(buf);
    const copied = await merged.copyPages(src, src.getPageIndices());
    copied.forEach((page) => merged.addPage(page));
  }
  const bytes = await merged.save();
  return Buffer.from(bytes);
}

/**
 * @param {import('multer').File} file
 */
async function ocrFileToResult(file) {
  return ocrService.extractText(file.buffer, file.mimetype);
}

/**
 * @param {import('multer').File} file
 */
function buildJsonResponseFileMeta(file) {
  return {
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size,
  };
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('multer').File} primaryFile
 * @param {string} ocrText
 * @param {boolean} forceUpload
 * @param {Buffer | null} [ocrPdfBuffer]
 */
async function respondWithAnalysisAndStorage(req, res, primaryFile, ocrText, forceUpload, ocrPdfBuffer = null) {
  try {
    const analysis = await aiService.analyzeDocument(ocrText);
    const provider = new GoogleDriveProvider(req.accessToken);

    let fileForUpload = primaryFile;
    if (ocrPdfBuffer && Buffer.isBuffer(ocrPdfBuffer) && ocrPdfBuffer.length > 0) {
      const baseName = (primaryFile.originalname || 'document').replace(/\.[^.]+$/i, '') || 'document';
      fileForUpload = {
        buffer: ocrPdfBuffer,
        mimetype: 'application/pdf',
        originalname: `${baseName}.pdf`,
        size: ocrPdfBuffer.length,
      };
    }

    try {
      const storageResult = await provider.uploadFile(
        fileForUpload.buffer,
        analysis.ordner,
        analysis.dateiname,
        fileForUpload.mimetype,
        forceUpload
      );

      return res.json({
        success: true,
        message: storageResult.duplicate ? 'Dokument bereits vorhanden' : 'Dokument erfolgreich abgelegt',
        file: buildJsonResponseFileMeta(fileForUpload),
        analysis: {
          ordner: analysis.ordner,
          dateiname: analysis.dateiname,
          typ: analysis.typ,
        },
        storage: {
          fileId: storageResult.fileId,
          fileName: storageResult.fileName,
          webViewLink: storageResult.webViewLink,
          duplicate: Boolean(storageResult.duplicate),
          path: `${analysis.ordner}/${storageResult.fileName || `${analysis.dateiname}.pdf`}`,
        },
      });
    } catch (uploadError) {
      return res.json({
        success: true,
        message: 'Dokument erfolgreich abgelegt',
        file: buildJsonResponseFileMeta(fileForUpload),
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
      file: buildJsonResponseFileMeta(primaryFile),
      analysis: {
        error: analysisError.message || 'Analyse fehlgeschlagen',
      },
      storage: {
        error: 'Upload nicht ausgeführt',
      },
    });
  }
}

router.post('/upload', requireAuth, (req, res) => {
  uploadFields(req, res, async (error) => {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'Datei zu groß (max. 10MB)' });
      }

      return res.status(400).json({ error: error.message });
    }

    if (error) {
      return res.status(400).json({ error: error.message || 'Upload fehlgeschlagen' });
    }

    const filesByField = req.files || {};
    const pageFiles = filesByField.pages;
    const docFile = filesByField.document?.[0];
    const forceUpload = req.body?.forceUpload === true || req.body?.forceUpload === 'true';

    const hasPageFiles = Array.isArray(pageFiles) && pageFiles.length > 0;

    if (hasPageFiles) {
      const files = pageFiles;
      const ocrResults = await Promise.all(files.map((f) => ocrFileToResult(f)));
      const texts = ocrResults.map((r) => r.text || '');
      const combinedText = texts.map((t, i) => `--- Seite ${i + 1} ---\n${t}`).join('\n\n');

      const allImages = files.every((f) => (f.mimetype || '').toLowerCase().startsWith('image/'));
      const pdfBuffers = ocrResults.map((r) => r.pdfBuffer).filter((b) => b && Buffer.isBuffer(b) && b.length > 0);

      let primaryFile = files[0];
      let ocrPdfBuffer = ocrResults[0]?.pdfBuffer || null;

      if (files.length > 1 && allImages && pdfBuffers.length === files.length) {
        try {
          ocrPdfBuffer = await mergePdfBuffers(pdfBuffers);
          primaryFile = {
            buffer: ocrPdfBuffer,
            mimetype: 'application/pdf',
            originalname: 'document.pdf',
            size: ocrPdfBuffer.length,
          };
          return respondWithAnalysisAndStorage(req, res, primaryFile, combinedText, forceUpload, null);
        } catch (mergeErr) {
          return res.status(500).json({
            error: mergeErr?.message || 'PDF-Zusammenführung fehlgeschlagen',
          });
        }
      }

      return respondWithAnalysisAndStorage(req, res, primaryFile, combinedText, forceUpload, ocrPdfBuffer);
    }

    if (docFile) {
      const ocr = await ocrService.extractText(docFile.buffer, docFile.mimetype);
      return respondWithAnalysisAndStorage(req, res, docFile, ocr.text || '', forceUpload, ocr.pdfBuffer);
    }

    return res.status(400).json({ error: 'Keine Datei hochgeladen' });
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
