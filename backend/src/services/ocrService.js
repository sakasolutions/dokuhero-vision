// OCR über Google Document AI (EU-Endpoint)
const { DocumentProcessorServiceClient } = require('@google-cloud/documentai').v1;
const OpenAI = require('openai');
const sharp = require('sharp');

const documentAiClient = new DocumentProcessorServiceClient({
  keyFilename: process.env.GOOGLE_VISION_KEY_FILE,
  apiEndpoint: 'eu-documentai.googleapis.com',
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const processorName = `projects/${process.env.GOOGLE_CLOUD_PROJECT_ID}/locations/${process.env.GOOGLE_DOCUMENT_AI_LOCATION}/processors/${process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID}`;

/**
 * @param {Buffer | Uint8Array | string | null | undefined} content
 * @returns {Buffer | null}
 */
function documentContentToPdfBuffer(content) {
  if (content == null) {
    return null;
  }
  if (Buffer.isBuffer(content)) {
    return content.length > 0 ? content : null;
  }
  if (content instanceof Uint8Array) {
    return content.length > 0 ? Buffer.from(content) : null;
  }
  if (typeof content === 'string') {
    const buf = Buffer.from(content, 'base64');
    return buf.length > 0 ? buf : null;
  }
  return null;
}

function extractPdfBufferFromDocument(document) {
  if (!document) {
    return null;
  }
  return documentContentToPdfBuffer(document.content);
}

/**
 * @param {Buffer} imageBuffer
 * @param {string} mimeType
 */
async function extractText(imageBuffer, mimeType) {
  const rawMime = (mimeType || 'application/octet-stream').toLowerCase();
  let bodyBuffer = imageBuffer;
  let mimeForRequest = rawMime;
  if (rawMime === 'image/heic' || rawMime === 'image/heif') {
    bodyBuffer = await sharp(imageBuffer).jpeg({ quality: 92 }).toBuffer();
    mimeForRequest = 'image/jpeg';
  }
  const base64 = bodyBuffer.toString('base64');

  const [result] = await documentAiClient.processDocument({
    name: processorName,
    rawDocument: {
      content: base64,
      mimeType: mimeForRequest,
    },
  });

  const doc = result.document;
  const text = doc?.text || '';
  const pdfBuffer = extractPdfBufferFromDocument(doc);

  return {
    text,
    textLength: text.length,
    hasText: text.length > 10,
    pdfBuffer,
  };
}

module.exports = {
  extractText,
};
