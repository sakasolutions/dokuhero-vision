const { DocumentProcessorServiceClient } = require('@google-cloud/documentai').v1;
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const documentAiClient = new DocumentProcessorServiceClient({
  keyFilename: process.env.GOOGLE_VISION_KEY_FILE,
  apiEndpoint: 'eu-documentai.googleapis.com',
});

const processorName = `projects/${process.env.GOOGLE_CLOUD_PROJECT_ID}/locations/${process.env.GOOGLE_DOCUMENT_AI_LOCATION}/processors/${process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID}`;

async function extractText(imageBuffer, mimeType) {
  try {
    const base64 = imageBuffer.toString('base64');
    const safeMime = mimeType === 'image/heic' ? 'image/jpeg' : mimeType;

    const [result] = await documentAiClient.processDocument({
      name: processorName,
      rawDocument: {
        content: base64,
        mimeType: safeMime,
      },
    });

    const text = result.document.text || '';
    const pdfContent = result.document.content || null;
    const pdfBuffer = pdfContent ? Buffer.from(pdfContent, 'base64') : null;

    return {
      text,
      textLength: text.length,
      hasText: text.length > 10,
      pdfBuffer,
    };
  } catch (error) {
    throw new Error(error.message || 'Document AI Fehler');
  }
}

module.exports = { extractText };
