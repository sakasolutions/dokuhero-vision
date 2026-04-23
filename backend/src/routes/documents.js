const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const PDFDocument = require('pdfkit');

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
 * @param {import('multer').File[]} files
 * @returns {Promise<Buffer>}
 */
async function imagesToPdf(files) {
  const imageBuffers = [];
  for (const file of files) {
    const mime = (file.mimetype || '').toLowerCase();
    if (mime === 'image/heic' || mime === 'image/heif') {
      imageBuffers.push(await sharp(file.buffer).jpeg({ quality: 90 }).toBuffer());
    } else {
      imageBuffers.push(file.buffer);
    }
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument();
    const chunks = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    try {
      imageBuffers.forEach((buf, index) => {
        if (index > 0) {
          doc.addPage();
        }
        doc.image(buf, 0, 0, {
          fit: [doc.page.width, doc.page.height],
          align: 'center',
          valign: 'center',
        });
      });
      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Liefert reinen Fließtext fürs Modell; gleiche sharp-Vorverarbeitung wie Single-Upload.
 * @param {import('multer').File} file
 */
async function ocrFileToText(file) {
  try {
    const isPdf = file.mimetype === 'application/pdf';
    let ocrBuffer = file.buffer;
    let ocrMimeType = file.mimetype;

    if (!isPdf) {
      ocrBuffer = await sharp(file.buffer)
        .resize(1600, 1600, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 85 })
        .toBuffer();
      ocrMimeType = 'image/jpeg';
    }

    const ocrResult = await ocrService.extractText(ocrBuffer, ocrMimeType);
    return ocrResult?.text || '';
  } catch {
    return '';
  }
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
 */
async function respondWithAnalysisAndStorage(req, res, primaryFile, ocrText, forceUpload) {
  try {
    const analysis = await aiService.analyzeDocument(ocrText);
    const provider = new GoogleDriveProvider(req.accessToken);

    try {
      const storageResult = await provider.uploadFile(
        primaryFile.buffer,
        analysis.ordner,
        analysis.dateiname,
        primaryFile.mimetype,
        forceUpload
      );

      return res.json({
        success: true,
        message: storageResult.duplicate ? 'Dokument bereits vorhanden' : 'Dokument erfolgreich abgelegt',
        file: buildJsonResponseFileMeta(primaryFile),
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
        file: buildJsonResponseFileMeta(primaryFile),
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
      const texts = await Promise.all(files.map((f) => ocrFileToText(f)));
      const combinedText = texts.map((t, i) => `--- Seite ${i + 1} ---\n${t}`).join('\n\n');

      const allImages = files.every((f) => (f.mimetype || '').toLowerCase().startsWith('image/'));
      let primaryFile = files[0];

      if (files.length > 1 && allImages) {
        try {
          const pdfBuffer = await imagesToPdf(files);
          primaryFile = {
            buffer: pdfBuffer,
            mimetype: 'application/pdf',
            originalname: 'document.pdf',
            size: pdfBuffer.length,
          };
        } catch (pdfErr) {
          return res.status(500).json({
            error: pdfErr?.message || 'PDF aus Bildern konnte nicht erzeugt werden',
          });
        }
      }

      return respondWithAnalysisAndStorage(req, res, primaryFile, combinedText, forceUpload);
    }

    if (docFile) {
      const ocrText = await ocrFileToText(docFile);
      return respondWithAnalysisAndStorage(req, res, docFile, ocrText, forceUpload);
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
