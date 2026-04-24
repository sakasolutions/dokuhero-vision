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
  return filename.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 60);
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
      max_tokens: 300,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Du bist ein Experte für deutsche Dokumente und Briefpost. 
Analysiere den Text und klassifiziere das Dokument PRÄZISE.

Antworte NUR mit diesem JSON:
{
  "ordner": "Kategorie",
  "dateiname": "YYYY-MM_Typ_Absender",
  "typ": "Dokumenttyp",
  "absender": "Firmen- oder Behördenname"
}

ORDNER - wähle den passendsten:
- Rechnungen (Strom, Gas, Wasser, Telefon, Internet, Einkauf, Handwerk)
- Versicherungen (KFZ, Haftpflicht, Hausrat, Kranken, Leben, Unfall)
- Bank (Kontoauszug, Kreditkarte, Kredit, Depot, Überweisung)
- Steuern (Steuerbescheid, Steuererklärung, Lohnsteuer, ELSTER)
- Behörden (Amt, Gemeinde, Stadt, Landkreis, Finanzamt, Jobcenter, Ausländerbehörde)
- Gesundheit (Arztbrief, Befund, Rezept, Krankenkasse, Krankenhaus, Apotheke)
- Arbeit (Arbeitsvertrag, Gehaltsabrechnung, Kündigung, Zeugnis, Personalakte)
- Verträge (Mietvertrag, Kaufvertrag, Mobilfunk, Strom, Internet, Abo)
- Immobilien (Mietvertrag, Nebenkosten, Hausgeld, WEG, Grundsteuer)
- Fahrzeug (KFZ-Brief, TÜV, Führerschein, Parkticket, Bußgeld)
- Sonstiges (nur wenn wirklich keine andere Kategorie passt)

REGELN für dateiname:
- Format: YYYY-MM_Typ_Absender
- Datum aus Dokument extrahieren, sonst aktuelles Datum
- Absender: kurz und eindeutig (z.B. Telekom, Finanzamt, AOK, ADAC)
- Keine Leerzeichen, Umlaute ersetzen (ä→ae, ö→oe, ü→ue, ß→ss)
- Max 60 Zeichen
- Beispiele:
  2024-03_Rechnung_Telekom
  2024-01_Kontoauszug_Sparkasse
  2023-12_Steuerbescheid_Finanzamt
  2024-02_Gehaltsabrechnung_Musterfirma
  2024-03_Arztbrief_Kardiologie-Muenchen
  2026-04_Bescheid_Finanzamt-Heidenheim
  2026-03_Brief_Landratsamt-Heidenheim
  2026-04_Kontoauszug_ING
  2026-03_Kontoauszug_Sparkasse
  2026-04_Police_Allianz
  2026-03_Kuendigung_HUK

WICHTIG: 
- Lieber eine spezifische Kategorie als Sonstiges
- Absender immer auf Deutsch
- Wenn Datum nicht erkennbar: aktuelles Jahr + aktueller Monat
- Format ist IMMER exakt: YYYY-MM_Typ_Absender
- Der Absender steht IMMER als letztes Element im Dateinamen (nach dem letzten Unterstrich)
- Bei Behörden: Behördenname plus Ort wenn erkennbar, mit Bindestrich (z.B. Finanzamt-Heidenheim, Landratsamt-Heidenheim)
- Bei Bank: konkreter Bankname (ING, Sparkasse, DKB, Commerzbank etc.)
- Gute Beispiele: 2026-04_Rechnung_IONOS, 2026-04_Rechnung_Canva, 2026-04_Kontoauszug_Sparkasse
- Schlechte Beispiele: 2026-04_Rechnung, 2026-04_IONOS_Rechnung`,
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
