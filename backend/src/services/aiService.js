const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function fallbackResult() {
  return {
    ordner: 'Sonstiges',
    dateiname: `Dokument_${Date.now()}`,
    typ: 'Unbekannt',
  };
}

function sanitizeFilename(filename) {
  return filename.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 50);
}

async function analyzeDocument(ocrText) {
  if (!ocrText || ocrText.trim().length < 10) {
    return {
      ordner: 'Sonstiges',
      dateiname: 'Unbekanntes_Dokument',
      typ: 'Unbekannt',
    };
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 200,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Du bist ein Dokumenten-Klassifizierungs-Assistent für deutsche Dokumente.
Analysiere den Text und antworte NUR mit einem JSON-Objekt in diesem Format:
{
  "ordner": "Kategorie",
  "dateiname": "YYYY-MM_Beschreibung_Absender",
  "typ": "Dokumenttyp"
}

Mögliche Ordner: Rechnungen, Verträge, Versicherungen, Behörden, Bank, Gesundheit, Steuern, Arbeit, Sonstiges

Regeln für dateiname:
- Kein .pdf am Ende
- Keine Leerzeichen, nur Unterstriche
- Format: YYYY-MM_Typ_Absender (z.B. 2024-03_Rechnung_Telekom)
- Wenn Datum unbekannt: aktuelles Jahr und Monat verwenden
- Max 50 Zeichen

Antworte nur mit dem JSON, keine Erklärungen.`,
        },
        {
          role: 'user',
          content: `Klassifiziere dieses Dokument:\n\n${ocrText.substring(0, 3000)}`,
        },
      ],
    });

    const rawContent = response?.choices?.[0]?.message?.content;
    const parsed = JSON.parse(rawContent);

    if (!parsed?.ordner || !parsed?.dateiname || !parsed?.typ) {
      return fallbackResult();
    }

    return {
      ordner: parsed.ordner,
      dateiname: sanitizeFilename(parsed.dateiname),
      typ: parsed.typ,
    };
  } catch (_error) {
    return fallbackResult();
  }
}

module.exports = {
  analyzeDocument,
};
