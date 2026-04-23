// OCR via GPT-4o mini Vision — ersetzt Google Vision API
// Vorteil: Ein API-Call für OCR + Klassifizierung möglich
const OpenAI = require('openai');
const sharp = require('sharp');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CROP_PROMPT = `Look at this image and find the document/paper in it.
Return ONLY a JSON object with the crop coordinates as percentages (0-100):
{ "x": left%, "y": top%, "width": width%, "height": height% }
If the entire image is already a document, return { "x": 0, "y": 0, "width": 100, "height": 100 }
Return ONLY the JSON, no explanation.`;

function parseCropResponse(content) {
  if (!content || typeof content !== 'string') {
    return null;
  }
  let str = content.trim();
  const fence = str.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) {
    str = fence[1].trim();
  }
  const brace = str.match(/\{[\s\S]*\}/);
  if (!brace) {
    return null;
  }
  try {
    return JSON.parse(brace[0]);
  } catch {
    return null;
  }
}

/**
 * @returns {{ buffer: Buffer, isJpeg: boolean }}
 */
async function detectAndCropDocument(imageBuffer) {
  try {
    const meta = await sharp(imageBuffer).metadata();
    const imgW = meta.width;
    const imgH = meta.height;
    if (!imgW || !imgH) {
      return { buffer: imageBuffer, isJpeg: false };
    }

    const fmt = meta.format;
    const dataMime =
      fmt === 'png'
        ? 'image/png'
        : fmt === 'webp'
          ? 'image/webp'
          : fmt === 'gif'
            ? 'image/gif'
            : 'image/jpeg';

    const base64 = imageBuffer.toString('base64');

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${dataMime};base64,${base64}` },
            },
            { type: 'text', text: CROP_PROMPT },
          ],
        },
      ],
      max_tokens: 300,
    });

    const raw = response?.choices?.[0]?.message?.content || '';
    const coords = parseCropResponse(raw);
    if (!coords) {
      return { buffer: imageBuffer, isJpeg: false };
    }

    const x = Number(coords.x);
    const y = Number(coords.y);
    const wPct = Number(coords.width);
    const hPct = Number(coords.height);

    if ([x, y, wPct, hPct].some((n) => Number.isNaN(n))) {
      return { buffer: imageBuffer, isJpeg: false };
    }

    if (x < 5 && y < 5 && wPct > 90 && hPct > 90) {
      return { buffer: imageBuffer, isJpeg: false };
    }

    const left = Math.floor((x / 100) * imgW);
    const top = Math.floor((y / 100) * imgH);
    const extW = Math.floor((wPct / 100) * imgW);
    const extH = Math.floor((hPct / 100) * imgH);

    const clampedLeft = Math.max(0, Math.min(left, imgW - 1));
    const clampedTop = Math.max(0, Math.min(top, imgH - 1));
    const maxW = imgW - clampedLeft;
    const maxH = imgH - clampedTop;
    const clampedWidth = Math.max(1, Math.min(extW, maxW));
    const clampedHeight = Math.max(1, Math.min(extH, maxH));

    const cropped = await sharp(imageBuffer)
      .extract({
        left: clampedLeft,
        top: clampedTop,
        width: clampedWidth,
        height: clampedHeight,
      })
      .jpeg({ quality: 90 })
      .toBuffer();

    return { buffer: cropped, isJpeg: true };
  } catch {
    return { buffer: imageBuffer, isJpeg: false };
  }
}

async function extractText(imageBuffer, mimeType) {
  try {
    const isPdf = mimeType === 'application/pdf';
    let bufferForOcr = imageBuffer;
    let dataMime = mimeType === 'image/heic' ? 'image/jpeg' : mimeType;

    if (!isPdf) {
      const { buffer, isJpeg } = await detectAndCropDocument(imageBuffer);
      bufferForOcr = buffer;
      if (isJpeg) {
        dataMime = 'image/jpeg';
      }
    }

    const base64 = bufferForOcr.toString('base64');
    const safeMimeType = dataMime === 'image/heic' ? 'image/jpeg' : dataMime;

    const response = await openai.chat.completions.create(
      isPdf
        ? {
            model: 'gpt-4o-mini',
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
            max_tokens: 2000,
          }
        : {
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
          }
    );

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
