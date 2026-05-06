const OpenAI = require('openai');

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const FRIST_TYPEN = new Set(['Zahlung', 'Kündigung', 'Antwort', 'Sonstiges']);

function normalizeIsoDate(val) {
  if (val == null) return null;
  const s = String(val).trim();
  if (!s || /^null$/i.test(s)) return null;
  const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
  return m ? m[1] : null;
}

/** Nur Ziffern/Punkt/Komma → normierte Zahl als String z.B. "9.99", sonst null */
function normalizeBetragString(val) {
  if (val == null) return null;
  if (typeof val === 'number' && Number.isFinite(val)) {
    return String(val);
  }
  const s = String(val).trim();
  if (!s || /^null$/i.test(s)) return null;
  const cleaned = s.replace(/\s/g, '').replace(',', '.').replace(/[^\d.-]/g, '');
  if (!cleaned || cleaned === '-' || cleaned === '.') return null;
  const n = parseFloat(cleaned);
  if (!Number.isFinite(n)) return null;
  return String(n);
}

function normalizeFristTyp(val) {
  if (val == null || typeof val !== 'string') return null;
  const t = val.trim();
  return FRIST_TYPEN.has(t) ? t : null;
}

function coerceErinnerungEmpfohlen(raw, fristIso, fristTyp) {
  let v = raw === true || raw === 'true';
  if (!fristIso) return false;
  const deadlineKinds = new Set(['Zahlung', 'Kündigung', 'Antwort', 'Sonstiges']);
  if (!fristTyp || !deadlineKinds.has(fristTyp)) return false;
  return v;
}

function buildAnalysisFromParsed(parsed) {
  const datum = normalizeIsoDate(parsed.datum);
  const frist = normalizeIsoDate(parsed.frist);
  const frist_typ = normalizeFristTyp(parsed.frist_typ);
  const betrag = normalizeBetragString(parsed.betrag);
  const erinnerung_empfohlen = coerceErinnerungEmpfohlen(parsed.erinnerung_empfohlen, frist, frist_typ);

  return {
    ordner: parsed.ordner,
    dateiname: sanitizeFilename(parsed.dateiname),
    typ: parsed.typ,
    absender: typeof parsed.absender === 'string' ? parsed.absender.trim() : '',
    betrag,
    datum,
    frist,
    frist_typ,
    erinnerung_empfohlen,
  };
}

function fallbackResult() {
  return {
    ordner: 'Sonstiges',
    dateiname: `Dokument_${Date.now()}`,
    typ: 'Unbekannt',
    absender: '',
    betrag: null,
    datum: null,
    frist: null,
    frist_typ: null,
    erinnerung_empfohlen: false,
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
      absender: '',
      betrag: null,
      datum: null,
      frist: null,
      frist_typ: null,
      erinnerung_empfohlen: false,
    };
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 520,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `Du bist ein Experte für deutsche Dokumente und Briefpost. 
Analysiere den Text und klassifiziere das Dokument PRÄZISE.

Antworte NUR mit diesem JSON (alle Schlüssel vorhanden, Strings wo angegeben):
{
  "ordner": "Kategorie",
  "dateiname": "YYYY-MM_Typ_Absender",
  "typ": "Dokumenttyp",
  "absender": "Firmen- oder Behördenname",
  "betrag": "9.99",
  "datum": "2026-04-01",
  "frist": "2026-06-15",
  "frist_typ": "Zahlung",
  "erinnerung_empfohlen": true
}

ZUSÄTZLICHE FELDER:
- betrag: Nur die Zahl als String (Punkt als Dezimaltrenner), KEIN Währungssymbol. null wenn kein klarer Gesamtbetrag/Rechnungsbetrag erkennbar.
- datum: Belegdatum oder Dokumentdatum im ISO-Format YYYY-MM-DD, sonst null.
- frist: Erkannte Zahlungsfrist, Kündigungsfrist (z.B. Ende Vertragslaufzeit), Behörden-/Antwortfrist im ISO-Format YYYY-MM-DD. null wenn keine konkrete Frist erkennbar.
- frist_typ: Genau einer von: "Zahlung", "Kündigung", "Antwort", "Sonstiges". null wenn frist null ist.
- erinnerung_empfohlen (boolean):
  true NUR wenn frist gesetzt ist UND es sich um eine relevante Frist handelt: Zahlungsfrist, Kündigungsfrist oder Behörden-/Antwortfrist (frist_typ passend).
  false bei normalen Rechnungen ohne echte Frist, Kontoauszügen, rein informativen Schreiben, Werbung.

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

    return buildAnalysisFromParsed(parsed);
  } catch (_error) {
    return fallbackResult();
  }
}

module.exports = {
  analyzeDocument,
};
