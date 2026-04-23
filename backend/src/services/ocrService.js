// OCR via GPT-4o mini Vision — ersetzt Google Vision API
// Vorteil: Ein API-Call für OCR + Klassifizierung möglich
const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function extractText(imageBuffer, mimeType) {
  try {
    const base64 = imageBuffer.toString('base64');
    const safeMimeType = mimeType === 'image/heic' ? 'image/jpeg' : mimeType;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${safeMimeType};base64,${base64}` },
            },
            {
              type: 'text',
              text: 'Extrahiere den gesamten Text aus diesem Dokument. Gib nur den rohen Text zurück, keine Erklärungen.',
            },
          ],
        },
      ],
      max_tokens: 2000,
    });

    const text = response?.choices?.[0]?.message?.content || '';

    return {
      text,
      textLength: text.length,
      hasText: text.length > 10,
    };
  } catch (error) {
    throw new Error(error.message || 'OCR-Fehler mit GPT-4o mini Vision');
  }
}

module.exports = {
  extractText,
};
