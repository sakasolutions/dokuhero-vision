const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');

const requireAuth = require('../middleware/auth');
const ocrService = require('../services/ocrService');
const aiService = require('../services/aiService');
const supabaseService = require('../services/supabaseService');
const GoogleDriveProvider = require('../services/storage/GoogleDriveProvider');

const router = express.Router();

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(['.jpeg', '.jpg', '.png', '.heic', '.heif', '.pdf']);
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
 * HEIC/HEIF → JPEG für OpenAI-OCR (sharp/libvips).
 * @param {Buffer} buffer
 * @param {string} [mimeType]
 * @returns {Promise<{ buffer: Buffer; mimeType: string }>}
 */
async function bufferAndMimeForOcr(buffer, mimeType) {
  const m = (mimeType || '').toLowerCase();
  if (m === 'image/heic' || m === 'image/heif') {
    const jpegBuffer = await sharp(buffer).jpeg({ quality: 90 }).toBuffer();
    return { buffer: jpegBuffer, mimeType: 'image/jpeg' };
  }
  return { buffer, mimeType: mimeType || 'application/octet-stream' };
}

/**
 * @param {import('multer').File} file
 * @returns {Promise<string>}
 */
async function ocrFileToText(file) {
  const { buffer, mimeType } = await bufferAndMimeForOcr(file.buffer, file.mimetype);
  const ocr = await ocrService.extractText(buffer, mimeType);
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
 * @param {Record<string, unknown>} [body]
 * @returns {{ ordner: string; dateiname: string; typ: string; absender: string } | null}
 */
function parseExistingAnalysis(body) {
  const raw = body?.existingAnalysis;
  if (raw == null || raw === '') {
    return null;
  }
  let obj = raw;
  if (typeof raw === 'string') {
    try {
      obj = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!obj || typeof obj !== 'object') {
    return null;
  }
  const ordner = obj.ordner;
  const dateiname = obj.dateiname;
  const typ = obj.typ;
  if (typeof ordner !== 'string' || typeof dateiname !== 'string' || typeof typ !== 'string') {
    return null;
  }
  return {
    ordner: ordner.trim(),
    dateiname: dateiname.trim(),
    typ: typ.trim(),
    absender: typeof obj.absender === 'string' ? obj.absender.trim() : '',
  };
}

/**
 * @param {import('express').Request} req
 * @param {import('multer').File | { buffer: Buffer; mimetype: string; originalname: string; size: number }} primaryFile
 * @param {string} ocrText
 * @param {{ ordner: string; dateiname: string; typ: string; absender?: string }} analysis
 * @param {{ fileId?: string; fileName?: string; webViewLink?: string; duplicate?: boolean }} storageResult
 * @param {string} [storagePath]
 */
async function persistDocumentAndScanCount(req, primaryFile, ocrText, analysis, storageResult, storagePath) {
  console.log('[persist] userId:', req.userId, 'fileId:', storageResult?.fileId);

  if (!req.userId || !storageResult?.fileId) {
    console.error('[persist] SKIP - userId:', req.userId, 'fileId:', storageResult?.fileId);
    return;
  }

  try {
    await supabaseService.saveDocument(req.userId, {
      filename: `${analysis.dateiname}.pdf`,
      originalFilename: primaryFile.originalname,
      category: analysis.ordner,
      subcategory: analysis.absender || null,
      provider: 'google_drive',
      storagePath: storagePath || null,
      driveFileId: storageResult.fileId,
      webViewLink: storageResult.webViewLink || null,
      ocrText: ocrText || '',
      documentType: analysis.typ,
      amount: null,
      documentDate: null,
      dueDate: null,
      sender: analysis.absender || null,
      mimeType: primaryFile.mimetype,
      size: primaryFile.size,
    });
    await supabaseService.incrementScanCount(req.userId);
  } catch (err) {
    console.error('[documents] Supabase saveDocument / incrementScanCount:', err?.message || err);
  }
}

/**
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('multer').File} primaryFile
 * @param {string} ocrText
 * @param {boolean} forceUpload
 * @param {Buffer | null} [ocrCroppedJpeg] — gecroptes Bild (JPEG) oder zusammengefügtes Mehrseiten-PDF
 * @param {'image/jpeg' | 'application/pdf' | null} [uploadMimeOverride] — sonst fileForUpload = primaryFile
 * @param {{ ordner: string; dateiname: string; typ: string; absender?: string } | null} [existingAnalysis]
 */
function analysisResponsePayload(analysis) {
  return {
    ordner: analysis.ordner,
    dateiname: analysis.dateiname,
    typ: analysis.typ,
    absender: analysis.absender || '',
  };
}

/** Upload nutzt Google Drive; nur bei explizitem Hetzner entfällt die Drive-Pflicht (bis S3 angebunden). */
function userRequiresGoogleDriveForUpload(req) {
  const p = req.storageProvider;
  return p === 'google_drive' || p == null || p === '';
}

async function respondWithAnalysisAndStorage(
  req,
  res,
  primaryFile,
  ocrText,
  forceUpload,
  ocrCroppedJpeg = null,
  uploadMimeOverride = null,
  existingAnalysis = null
) {
  try {
    if (userRequiresGoogleDriveForUpload(req) && !req.driveToken) {
      return res.status(401).json({
        error: 'Google Drive nicht verbunden',
        code: 'DRIVE_NOT_CONNECTED',
      });
    }

    const usedExisting =
      Boolean(forceUpload) &&
      existingAnalysis != null &&
      typeof existingAnalysis.ordner === 'string' &&
      typeof existingAnalysis.dateiname === 'string' &&
      typeof existingAnalysis.typ === 'string';

    let analysis;
    if (usedExisting) {
      const base = String(existingAnalysis.dateiname).replace(/\.pdf$/i, '');
      analysis = {
        ordner: existingAnalysis.ordner,
        typ: existingAnalysis.typ,
        absender: existingAnalysis.absender || '',
        dateiname: `${base}_copy${Date.now()}`,
      };
    } else {
      analysis = await aiService.analyzeDocument(ocrText);
    }

    const driveForce = forceUpload && !usedExisting;

    const provider = new GoogleDriveProvider(req.driveToken);

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
        driveForce
      );

      const storagePath = `${analysis.ordner}/${storageResult.fileName || `${analysis.dateiname}.pdf`}`;
      await persistDocumentAndScanCount(req, fileForUpload, ocrText, analysis, storageResult, storagePath);

      return res.json({
        success: true,
        message: storageResult.duplicate ? 'Dokument bereits vorhanden' : 'Dokument erfolgreich abgelegt',
        file: buildJsonResponseFileMeta(fileForUpload),
        analysis: analysisResponsePayload(analysis),
        storage: {
          fileId: storageResult.fileId,
          fileName: storageResult.fileName,
          webViewLink: storageResult.webViewLink,
          duplicate: Boolean(storageResult.duplicate),
          path: storagePath,
        },
      });
    } catch (uploadError) {
      return res.json({
        success: true,
        message: 'Dokument erfolgreich abgelegt',
        file: buildJsonResponseFileMeta(fileForUpload),
        analysis: analysisResponsePayload(analysis),
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
    const existingAnalysis = parseExistingAnalysis(req.body);
    const fastForce = Boolean(forceUpload && existingAnalysis);

    const hasPageFiles = Array.isArray(pageFiles) && pageFiles.length > 0;

    if (hasPageFiles) {
      const files = pageFiles;

      if (fastForce) {
        if (files.length > 1) {
          try {
            const imageBuffersForPdf = await Promise.all(
              files.map(async (file) => {
                const { buffer } = await bufferAndMimeForOcr(file.buffer, file.mimetype);
                return buffer;
              })
            );
            const PDFDocument = require('pdfkit');
            const pdfBuffer = await new Promise((resolve, reject) => {
              const doc = new PDFDocument({ autoFirstPage: false });
              const chunks = [];
              doc.on('data', (chunk) => chunks.push(chunk));
              doc.on('end', () => resolve(Buffer.concat(chunks)));
              doc.on('error', reject);
              imageBuffersForPdf.forEach((imgBuf) => {
                doc.addPage({ size: 'A4' });
                doc.image(imgBuf, 0, 0, {
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
            return respondWithAnalysisAndStorage(req, res, primaryFile, '', true, null, null, existingAnalysis);
          } catch (e) {
            return res.status(500).json({
              error: e?.message || 'PDF-Erstellung fehlgeschlagen',
            });
          }
        }
        return respondWithAnalysisAndStorage(req, res, files[0], '', true, null, null, existingAnalysis);
      }

      // OCR alle Seiten
      const texts = await Promise.all(files.map((f) => ocrFileToText(f)));
      const combinedText = texts.map((t, i) => `--- Seite ${i + 1} ---\n${t}`).join('\n\n');

      // Mehrere Bilder → eine PDF
      if (files.length > 1) {
        try {
          const imageBuffersForPdf = await Promise.all(
            files.map(async (file) => {
              const { buffer } = await bufferAndMimeForOcr(file.buffer, file.mimetype);
              return buffer;
            })
          );
          const PDFDocument = require('pdfkit');
          const pdfBuffer = await new Promise((resolve, reject) => {
            const doc = new PDFDocument({ autoFirstPage: false });
            const chunks = [];
            doc.on('data', (chunk) => chunks.push(chunk));
            doc.on('end', () => resolve(Buffer.concat(chunks)));
            doc.on('error', reject);
            imageBuffersForPdf.forEach((imgBuf) => {
              doc.addPage({ size: 'A4' });
              doc.image(imgBuf, 0, 0, {
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
      if (fastForce) {
        return respondWithAnalysisAndStorage(req, res, docFile, '', true, null, null, existingAnalysis);
      }

      const { buffer: ocrInputBuffer, mimeType: ocrInputMime } = await bufferAndMimeForOcr(
        docFile.buffer,
        docFile.mimetype
      );
      const ocr = await ocrService.extractText(ocrInputBuffer, ocrInputMime);
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
    // Lade Dokumente aus Supabase statt Google Drive
    const supabaseService = require('../services/supabaseService');

    if (!req.userId) {
      return res.status(401).json({ success: false, error: 'Kein User' });
    }

    const docs = await supabaseService.getUserDocuments(req.userId);

    // Gruppiere nach Kategorie für Frontend
    const folders = {};
    for (const doc of docs) {
      const cat = doc.category || 'Sonstiges';
      if (!folders[cat]) {
        folders[cat] = {
          name: cat,
          count: 0,
          modifiedTime: doc.created_at,
          webViewLink: doc.drive_web_link || null,
          subFolders: {},
        };
      }
      folders[cat].count++;

      // Unterordner (Absender)
      const sub = doc.subcategory || doc.sender;
      if (sub) {
        if (!folders[cat].subFolders[sub]) {
          folders[cat].subFolders[sub] = {
            name: sub,
            count: 0,
            modifiedTime: doc.created_at,
            webViewLink: doc.drive_web_link || null,
          };
        }
        folders[cat].subFolders[sub].count++;
      }
    }

    // Konvertiere zu Array
    const result = Object.values(folders).map((f) => ({
      ...f,
      subFolders: Object.values(f.subFolders),
    }));

    return res.json({ success: true, documents: result });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
