const OpenAI = require('openai');
const sharp = require('sharp');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function extractText(imageBuffer, mimeType) {
  const isPdf = mimeType === 'application/pdf';
  const base64 = imageBuffer.toString('base64');
  const safeMime = mimeType === 'image/heic' ? 'image/jpeg' : mimeType;

  if (isPdf) {
    // PDF direkt an GPT
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'file',
              file: {
                filename: 'document.pdf',
                file_data: `data:application/pdf;base64,${base64}`,
              },
            },
            {
              type: 'text',
              text: 'Extrahiere den gesamten Text aus diesem Dokument. Gib nur den rohen Text zurück, keine Erklärungen.',
            },
          ],
        },
      ],
    });
    const text = response.choices[0].message.content || '';
    return { text, textLength: text.length, hasText: text.length > 10, croppedBuffer: null };
  }

  // SCHRITT 1: Bild zuschneiden mit GPT Vision
  const cropResponse = await openai.chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 100,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:${safeMime};base64,${base64}` },
          },
          {
            type: 'text',
            text: `You are a precise document scanner. Find the document/paper/letter in this photo.
          
The document is a rectangular piece of paper - it may be on a table, floor, or dark surface.
Look for: straight edges, text content, white or light colored area.

Return ONLY a JSON object with pixel percentages (0-100) of where the document is:
{"x": <left edge %>, "y": <top edge %>, "width": <document width %>, "height": <document height %>}

Be aggressive about cropping - remove ALL background, table, hands, shadows.
If the photo is already just the document with no background, return {"x":0,"y":0,"width":100,"height":100}
Return ONLY the JSON, nothing else.`,
          },
        ],
      },
    ],
  });

  let croppedBuffer = null;
  try {
    const cropText = cropResponse.choices[0].message.content || '';
    const match = cropText.match(/\{[^}]+\}/);
    if (match) {
      const coords = JSON.parse(match[0]);
      const meta = await sharp(imageBuffer).metadata();
      const x = Math.max(0, Math.floor((coords.x / 100) * meta.width));
      const y = Math.max(0, Math.floor((coords.y / 100) * meta.height));
      const w = Math.min(meta.width - x, Math.floor((coords.width / 100) * meta.width));
      const h = Math.min(meta.height - y, Math.floor((coords.height / 100) * meta.height));

      // Nur croppen wenn wirklich Rand vorhanden
      if (coords.x > 3 || coords.y > 3 || coords.width < 97 || coords.height < 97) {
        croppedBuffer = await sharp(imageBuffer)
          .extract({ left: x, top: y, width: w, height: h })
          .jpeg({ quality: 95 })
          .toBuffer();
        console.log(`✂️ Crop: x=${coords.x}% y=${coords.y}% w=${coords.width}% h=${coords.height}%`);
      }
    }
  } catch (e) {
    console.error('Crop Fehler:', e.message);
  }

  // SCHRITT 2: OCR auf gecroptem Bild
  const ocrBuffer = croppedBuffer || imageBuffer;
  const ocrBase64 = ocrBuffer.toString('base64');
  const ocrMime = croppedBuffer ? 'image/jpeg' : safeMime;

  const ocrResponse = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: `data:${ocrMime};base64,${ocrBase64}` },
          },
          {
            type: 'text',
            text: 'Extrahiere den gesamten Text aus diesem Dokument. Gib nur den rohen Text zurück, keine Erklärungen.',
          },
        ],
      },
    ],
  });

  const text = ocrResponse.choices[0].message.content || '';
  return { text, textLength: text.length, hasText: text.length > 10, croppedBuffer };
}

module.exports = { extractText };
