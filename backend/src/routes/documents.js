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
 * @param {import('multer').File} file
 * @returns {Promise<string>}
 */
async function ocrFileToText(file) {
  const ocr = await ocrService.extractText(file.buffer, file.mimetype);
  return ocr.text || '';
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
 * @param {Buffer | null} [ocrCroppedJpeg] — gecroptes Bild (JPEG) oder zusammengefügtes Mehrseiten-PDF
 * @param {'image/jpeg' | 'application/pdf' | null} [uploadMimeOverride] — sonst fileForUpload = primaryFile
 */
async function respondWithAnalysisAndStorage(
  req,
  res,
  primaryFile,
  ocrText,
  forceUpload,
  ocrCroppedJpeg = null,
  uploadMimeOverride = null
) {
  try {
    const analysis = await aiService.analyzeDocument(ocrText);
    const provider = new GoogleDriveProvider(req.accessToken);

    let fileForUpload = primaryFile;
    if (
      ocrCroppedJpeg &&
      Buffer.isBuffer(ocrCroppedJpeg) &&
      ocrCroppedJpeg.length > 0 &&
      uploadMimeOverride
    ) {
      const baseName = (primaryFile.originalname || 'document').replace(/\.[^.]+$/i, '') || 'document';
      const ext = uploadMimeOverride === 'application/pdf' ? 'pdf' : 'jpg';
      fileForUpload = {
        buffer: ocrCroppedJpeg,
        mimetype: uploadMimeOverride,
        originalname: `${baseName}.${ext}`,
        size: ocrCroppedJpeg.length,
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

      // OCR alle Seiten
      const texts = await Promise.all(files.map((f) => ocrFileToText(f)));
      const combinedText = texts.map((t, i) => `--- Seite ${i + 1} ---\n${t}`).join('\n\n');

      // Mehrere Bilder → eine PDF
      if (files.length > 1) {
        try {
          const PDFDocument = require('pdfkit');
          const pdfBuffer = await new Promise((resolve, reject) => {
            const doc = new PDFDocument({ autoFirstPage: false });
            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
            files.forEach((file) => {
              doc.addPage({ size: 'A4' });
              doc.image(file.buffer, 0, 0, {
                fit: [doc.page.width, doc.page.height],
                align: 'center',
                valign: 'center',
              });
            });
            doc.end();
          });
          const primaryFile = {
            buffer: pdfBuffer,
            mimetype: 'application/pdf',
            originalname: 'document.pdf',
            size: pdfBuffer.length,
          };
          return respondWithAnalysisAndStorage(req, res, primaryFile, combinedText, forceUpload);
        } catch (e) {
          return res.status(500).json({
            error: e?.message || 'PDF-Erstellung fehlgeschlagen',
          });
        }
      }

      // Nur eine Seite
      return respondWithAnalysisAndStorage(req, res, files[0], combinedText, forceUpload);
    }

    if (docFile) {
      const ocr = await ocrService.extractText(docFile.buffer, docFile.mimetype);
      const m = (docFile.mimetype || '').toLowerCase();
      const isImage = m.startsWith('image/');
      const hasCrop = ocr.croppedBuffer && Buffer.isBuffer(ocr.croppedBuffer) && ocr.croppedBuffer.length > 0;
      return respondWithAnalysisAndStorage(
        req,
        res,
        docFile,
        ocr.text || '',
        forceUpload,
        hasCrop && isImage ? ocr.croppedBuffer : null,
        hasCrop && isImage ? 'image/jpeg' : null
      );
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
