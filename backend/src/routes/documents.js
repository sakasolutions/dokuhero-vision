const express = require('express');
const multer = require('multer');
const path = require('path');
const { GetObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const sharp = require('sharp');

const requireAuth = require('../middleware/auth');
const ocrService = require('../services/ocrService');
const aiService = require('../services/aiService');
const supabaseService = require('../services/supabaseService');
const GoogleDriveProvider = require('../services/storage/GoogleDriveProvider');
const HetznerS3Provider = require('../services/storage/HetznerS3Provider');

const router = express.Router();

function contentDispositionFilename(name) {
  const n = String(name || 'document.pdf').replace(/[\r\n"]/g, '_').trim();
  return n || 'document.pdf';
}

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

function getStorageProvider(req) {
  const provider = req.storageProvider || 'google_drive';

  if (provider === 'hetzner') {
    return new HetznerS3Provider(req.userId);
  }

  // Google Drive (default)
  if (!req.driveToken) {
    throw new Error('DRIVE_NOT_CONNECTED');
  }
  return new GoogleDriveProvider(req.driveToken);
}

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
    betrag: obj.betrag != null && obj.betrag !== '' ? String(obj.betrag) : null,
    datum: typeof obj.datum === 'string' && obj.datum.trim() ? obj.datum.trim() : null,
    frist: typeof obj.frist === 'string' && obj.frist.trim() ? obj.frist.trim() : null,
    frist_typ: typeof obj.frist_typ === 'string' && obj.frist_typ.trim() ? obj.frist_typ.trim() : null,
    erinnerung_empfohlen: Boolean(obj.erinnerung_empfohlen),
  };
}

function parseAmountForDb(betrag) {
  if (betrag == null || betrag === '') return null;
  const n = parseFloat(String(betrag).replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {import('express').Request} req
 * @param {import('multer').File | { buffer: Buffer; mimetype: string; originalname: string; size: number }} primaryFile
 * @param {string} ocrText
 * @param analysis
 * @param {{ fileId?: string; fileName?: string; webViewLink?: string; duplicate?: boolean }} storageResult
 * @param {string} [storagePath]
 * @returns {Promise<string | null>} documents.id
 */
async function persistDocumentAndScanCount(req, primaryFile, ocrText, analysis, storageResult, storagePath) {
  console.log('[persist] userId:', req.userId, 'fileId:', storageResult?.fileId);

  if (!req.userId || !storageResult?.fileId) {
    console.error('[persist] SKIP - userId:', req.userId, 'fileId:', storageResult?.fileId);
    return null;
  }

  try {
    const provider = req.storageProvider || 'google_drive';
    const saved = await supabaseService.saveDocument(req.userId, {
      filename: `${analysis.dateiname}.pdf`,
      originalFilename: primaryFile.originalname,
      category: analysis.ordner,
      subcategory: analysis.absender || null,
      provider,
      storagePath: storagePath || null,
      driveFileId: storageResult.fileId,
      webViewLink: storageResult.webViewLink || null,
      ocrText: ocrText || '',
      documentType: analysis.typ,
      amount: parseAmountForDb(analysis.betrag),
      documentDate: analysis.datum || null,
      dueDate: analysis.frist || null,
      sender: analysis.absender || null,
      mimeType: primaryFile.mimetype,
      size: primaryFile.size,
    });
    await supabaseService.incrementScanCount(req.userId);
    return saved?.id ?? null;
  } catch (err) {
    console.error('[documents] Supabase saveDocument / incrementScanCount:', err?.message || err);
    return null;
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
    betrag: analysis.betrag ?? null,
    datum: analysis.datum ?? null,
    frist: analysis.frist ?? null,
    frist_typ: analysis.frist_typ ?? null,
    erinnerung_empfohlen: Boolean(analysis.erinnerung_empfohlen),
  };
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
    let provider;
    try {
      provider = getStorageProvider(req);
    } catch (e) {
      if (e?.message === 'DRIVE_NOT_CONNECTED') {
        return res.status(401).json({
          error: 'Google Drive nicht verbunden. Bitte in Einstellungen verbinden.',
          code: 'DRIVE_NOT_CONNECTED',
        });
      }
      throw e;
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
        betrag: existingAnalysis.betrag ?? null,
        datum: existingAnalysis.datum ?? null,
        frist: existingAnalysis.frist ?? null,
        frist_typ: existingAnalysis.frist_typ ?? null,
        erinnerung_empfohlen: Boolean(existingAnalysis.erinnerung_empfohlen),
      };
    } else {
      analysis = await aiService.analyzeDocument(ocrText);
    }

    const uploadForce = forceUpload && !usedExisting;

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

    const storageResult = await provider.uploadFile(
      fileForUpload.buffer,
      analysis.ordner,
      analysis.dateiname,
      fileForUpload.mimetype,
      uploadForce
    );

    const storagePath =
      req.storageProvider === 'hetzner'
        ? storageResult.storagePath || null
        : `${analysis.ordner}/${storageResult.fileName || `${analysis.dateiname}.pdf`}`;
    const documentId = await persistDocumentAndScanCount(req, fileForUpload, ocrText, analysis, storageResult, storagePath);

    return res.json({
      success: true,
      message: storageResult.duplicate ? 'Dokument bereits vorhanden' : 'Dokument erfolgreich abgelegt',
      file: buildJsonResponseFileMeta(fileForUpload),
      document_id: documentId,
      analysis: analysisResponsePayload(analysis),
      storage: {
        fileId: storageResult.fileId,
        fileName: storageResult.fileName,
        webViewLink: storageResult.webViewLink,
        duplicate: Boolean(storageResult.duplicate),
        path: storagePath,
      },
    });
  } catch (analysisError) {
    if (analysisError?.message === 'DRIVE_NOT_CONNECTED') {
      return res.status(401).json({
        error: 'Google Drive nicht verbunden. Bitte in Einstellungen verbinden.',
        code: 'DRIVE_NOT_CONNECTED',
      });
    }
    return res.status(500).json({ success: false, error: analysisError?.message || 'Upload fehlgeschlagen' });
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

      // Nur eine Seite: kein PDF-Kit — Raster direkt als JPEG speichern (PDF unverändert)
      const single = files[0];
      const mimeLower = (single.mimetype || '').toLowerCase();
      if (mimeLower === 'application/pdf') {
        return respondWithAnalysisAndStorage(req, res, single, combinedText, forceUpload);
      }

      const { buffer: bufIn, mimeType: mtIn } = await bufferAndMimeForOcr(single.buffer, single.mimetype);
      let uploadBuffer = bufIn;
      if (mtIn === 'image/png') {
        uploadBuffer = await sharp(bufIn).jpeg({ quality: 92 }).toBuffer();
      }

      const baseName = (single.originalname || 'document').replace(/\.[^.]+$/i, '') || 'document';
      const primaryFile = {
        buffer: uploadBuffer,
        mimetype: 'image/jpeg',
        originalname: `${baseName}.jpg`,
        size: uploadBuffer.length,
      };
      return respondWithAnalysisAndStorage(req, res, primaryFile, combinedText, forceUpload);
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

router.get('/folder/:category/:subcategory', requireAuth, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, error: 'Kein User' });
    }

    const category = decodeURIComponent(req.params.category);
    const subcategory = decodeURIComponent(req.params.subcategory);

    const docs = await supabaseService.getDocumentsByCategoryAndSubcategory(req.userId, category, subcategory);

    return res.json({ success: true, documents: docs });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/folder/:folderName', requireAuth, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, error: 'Kein User' });
    }

    const folderName = decodeURIComponent(req.params.folderName);
    const subRaw = req.query.sub != null ? String(req.query.sub).trim() : '';

    let docs = await supabaseService.getDocumentsByCategory(req.userId, folderName);
    if (subRaw) {
      docs = docs.filter((d) => {
        const sub = d.subcategory || d.sender || '';
        return String(sub).trim() === subRaw;
      });
    }

    return res.json({ success: true, documents: docs });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/search', requireAuth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ success: true, documents: [] });
    }

    const results = await supabaseService.searchDocuments(req.userId, q.trim());
    res.json({ success: true, documents: results });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/:id/download', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await supabaseService.getDocument(id, req.userId);

    if (!doc) {
      return res.status(404).json({ error: 'Dokument nicht gefunden' });
    }

    if (doc.provider === 'hetzner') {
      if (!doc.storage_path) {
        return res.status(404).json({ error: 'Kein Download-Link verfügbar' });
      }
      const hetzner = new HetznerS3Provider(req.userId);
      const bucket = hetzner.bucket || process.env.HETZNER_S3_BUCKET;
      if (!bucket) {
        return res.status(500).json({ error: 'S3-Bucket nicht konfiguriert' });
      }

      const command = new GetObjectCommand({
        Bucket: bucket,
        Key: doc.storage_path,
      });

      let s3Response;
      try {
        s3Response = await hetzner.client.send(command);
      } catch (err) {
        const code = err?.$metadata?.httpStatusCode;
        if (code === 404 || err?.name === 'NoSuchKey') {
          return res.status(404).json({ error: 'Datei nicht gefunden' });
        }
        throw err;
      }

      const filename = contentDispositionFilename(doc.filename);
      const contentType = doc.mime_type || s3Response.ContentType || 'application/pdf';

      res.setHeader('Content-Type', contentType);
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

      if (s3Response.ContentLength != null) {
        res.setHeader('Content-Length', String(s3Response.ContentLength));
      }

      const body = s3Response.Body;
      if (!body || typeof body.pipe !== 'function') {
        return res.status(500).json({ error: 'S3-Stream nicht verfügbar' });
      }

      body.on('error', (streamErr) => {
        console.error('[documents/download] S3 stream:', streamErr?.message || streamErr);
        if (!res.headersSent) {
          res.status(500).json({ error: 'Download fehlgeschlagen' });
        } else {
          res.destroy(streamErr);
        }
      });

      res.on('close', () => {
        if (typeof body.destroy === 'function') {
          body.destroy();
        }
      });

      body.pipe(res);
      return;
    }

    if (doc.provider === 'google_drive' && doc.drive_web_link) {
      return res.redirect(doc.drive_web_link);
    }

    return res.status(404).json({ error: 'Kein Download-Link verfügbar' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const supabaseSvc = require('../services/supabaseService');
    const doc = await supabaseSvc.getDocument(req.params.id, req.userId);

    if (!doc) {
      return res.status(404).json({ error: 'Nicht gefunden' });
    }

    if (doc.provider === 'hetzner' && doc.storage_path) {
      const HetznerS3 = require('../services/storage/HetznerS3Provider');
      const hetzner = new HetznerS3(req.userId);
      await hetzner.deleteFile(doc.storage_path);
    }

    await supabaseSvc.deleteDocument(req.params.id, req.userId);

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/', requireAuth, async (req, res) => {
  try {
    if (!req.userId) {
      return res.status(401).json({ success: false, error: 'Kein User' });
    }

    // Immer aus Supabase — Zähler für Kategorie/Unterordner = echte Zeilen in `documents`
    const docs = await supabaseService.getUserDocuments(req.userId);

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
      const bucket = folders[cat];
      bucket.count++;

      const docTime = doc.created_at;
      if (docTime && (!bucket.modifiedTime || new Date(docTime) > new Date(bucket.modifiedTime))) {
        bucket.modifiedTime = docTime;
      }

      const sub = doc.subcategory || doc.sender;
      if (sub) {
        const subKey = String(sub).trim();
        if (subKey) {
          if (!bucket.subFolders[subKey]) {
            bucket.subFolders[subKey] = {
              name: subKey,
              count: 0,
              modifiedTime: doc.created_at,
              webViewLink: doc.drive_web_link || null,
            };
          }
          const subBucket = bucket.subFolders[subKey];
          subBucket.count++;
          if (docTime && (!subBucket.modifiedTime || new Date(docTime) > new Date(subBucket.modifiedTime))) {
            subBucket.modifiedTime = docTime;
          }
        }
      }
    }

    const result = Object.values(folders)
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'de', { sensitivity: 'base' }))
      .map((f) => ({
        id: f.name,
        type: 'folder',
        ...f,
        subFolders: Object.values(f.subFolders).sort((a, b) =>
          String(a.name || '').localeCompare(String(b.name || ''), 'de', { sensitivity: 'base' })
        ),
      }));

    return res.json({ success: true, documents: result });
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
