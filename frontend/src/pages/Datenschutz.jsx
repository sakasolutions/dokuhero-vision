const sectionTitle = {
  fontSize: '13px',
  fontWeight: 600,
  color: '#9ca3af',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  marginTop: '32px',
  marginBottom: '8px',
};

const text = {
  fontSize: '15px',
  color: '#374151',
  lineHeight: 1.7,
  margin: 0,
};

const textPre = {
  ...text,
  whiteSpace: 'pre-line',
};

const page = {
  minHeight: '100vh',
  width: '100%',
  backgroundColor: '#ffffff',
  fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
};

const content = {
  width: '100%',
  maxWidth: '600px',
  margin: '0 auto',
  padding: '40px 24px',
};

const logoBox = {
  width: '32px',
  height: '32px',
  borderRadius: '8px',
  backgroundColor: '#6366f1',
  color: '#fff',
  display: 'grid',
  placeItems: 'center',
  fontSize: '16px',
  fontWeight: 700,
  lineHeight: 1,
};

const logoText = {
  fontSize: '16px',
  fontWeight: 700,
  color: '#111827',
};

const backLink = {
  color: '#6366f1',
  cursor: 'pointer',
  background: 'none',
  border: 'none',
  padding: 0,
  fontSize: '15px',
  fontFamily: 'inherit',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '8px',
};

const linkStyle = {
  color: '#6366f1',
  textDecoration: 'none',
};

function Datenschutz() {
  return (
    <main style={page}>
      <div style={content}>
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px 16px',
            marginBottom: '32px',
          }}
        >
          <button
            type="button"
            onClick={() => window.history.back()}
            style={backLink}
            aria-label="Zurück"
          >
            ← Zurück
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={logoBox}>D</div>
            <span style={logoText}>DokuHero</span>
          </div>
        </header>

        <h1
          style={{
            margin: 0,
            fontSize: '28px',
            fontWeight: 700,
            color: '#111827',
            lineHeight: 1.2,
          }}
        >
          Datenschutzerklärung
        </h1>
        <p style={{ margin: '8px 0 0', fontSize: '15px', color: '#6b7280' }}>Stand: April 2026</p>

        <h2 style={{ ...sectionTitle, marginTop: '32px' }}>Verantwortlicher</h2>
        <p style={textPre}>{`SAKA Solutions – IT & Webdesign
Inhaber: Sinan Sakacilar
Esslinger Str. 15, 89537 Giengen an der Brenz
E-Mail: kontakt@saka-it.de · Tel.: +49 1522 6396063`}</p>

        <h2 style={sectionTitle}>Was DokuHero tut</h2>
        <p style={text}>
          DokuHero ist eine Web-App zum automatischen Sortieren von Dokumenten. Du fotografierst oder lädst ein Dokument hoch — unsere KI
          erkennt Typ und Absender und legt die Datei automatisch in deinem Google Drive ab.
        </p>

        <h2 style={sectionTitle}>Welche Daten wir verarbeiten</h2>
        <p style={{ ...text, fontWeight: 600, marginBottom: '8px' }}>Google-Konto (OAuth 2.0):</p>
        <p style={{ ...text, marginBottom: '12px' }}>
          Beim Login erheben wir deinen Namen, deine E-Mail-Adresse und dein Profilbild von Google. Diese Daten werden nicht dauerhaft bei
          uns gespeichert.
          <br />
          <span style={{ fontSize: '14px', color: '#6b7280' }}>Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung).</span>
        </p>

        <p style={{ ...text, fontWeight: 600, marginBottom: '8px' }}>Dokumente/Bilder:</p>
        <p style={{ ...text, marginBottom: '12px' }}>
          Von dir hochgeladene Dokumente und Fotos werden zur Analyse kurzzeitig auf unserem Server verarbeitet und anschließend automatisch
          gelöscht. Wir speichern keine Dokumente dauerhaft.
          <br />
          <span style={{ fontSize: '14px', color: '#6b7280' }}>Rechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO.</span>
        </p>

        <p style={{ ...text, fontWeight: 600, marginBottom: '8px' }}>Google Drive:</p>
        <p style={{ ...text, marginBottom: '12px' }}>
          Die analysierten Dokumente werden ausschließlich in deinem eigenen Google Drive gespeichert. Wir haben nur Zugriff auf Dateien, die
          DokuHero selbst erstellt hat (Scope: drive.file).
        </p>

        <p style={{ ...text, fontWeight: 600, marginBottom: '8px' }}>Server-Logs:</p>
        <p style={text}>
          IP-Adresse, Datum/Uhrzeit, User-Agent zur IT-Sicherheit. Speicherdauer: 7–14 Tage.
          <br />
          <span style={{ fontSize: '14px', color: '#6b7280' }}>Rechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO.</span>
        </p>

        <h2 style={sectionTitle}>Drittanbieter</h2>
        <p style={{ ...text, fontWeight: 600, marginBottom: '8px' }}>Google LLC (OAuth, Google Drive API):</p>
        <p style={{ ...text, marginBottom: '12px' }}>
          Zur Authentifizierung und Dateispeicherung nutzen wir Google-Dienste. Google kann dabei Daten gemäß seiner Datenschutzrichtlinie
          verarbeiten. Weitere Infos:{' '}
          <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer" style={linkStyle}>
            https://policies.google.com/privacy
          </a>
        </p>

        <p style={{ ...text, fontWeight: 600, marginBottom: '8px' }}>OpenAI Inc. (KI-Analyse):</p>
        <p style={{ ...text, marginBottom: '12px' }}>
          Hochgeladene Dokumente werden zur Texterkennung und Klassifizierung kurzzeitig an die OpenAI API übermittelt. Mit OpenAI besteht
          ein Auftragsverarbeitungsvertrag (DPA) gemäß Art. 28 DSGVO. Dabei kann eine Drittlandübermittlung (USA) stattfinden — Grundlage:
          EU-Standardvertragsklauseln. Weitere Infos:{' '}
          <a href="https://openai.com/privacy" target="_blank" rel="noreferrer" style={linkStyle}>
            https://openai.com/privacy
          </a>
        </p>

        <p style={{ ...text, fontWeight: 600, marginBottom: '8px' }}>Hetzner Online GmbH (Hosting):</p>
        <p style={text}>
          Unser Server steht in Deutschland (Rechenzentrum Falkenstein). Weitere Infos:{' '}
          <a href="https://www.hetzner.com/legal/privacy-policy" target="_blank" rel="noreferrer" style={linkStyle}>
            https://www.hetzner.com/legal/privacy-policy
          </a>
        </p>

        <h2 style={sectionTitle}>Speicherdauer</h2>
        <p style={text}>
          Wir speichern keine Dokumente oder persönlichen Daten dauerhaft. Google-Token werden nur in deinem Browser (localStorage)
          gespeichert und bei Abmeldung gelöscht.
        </p>

        <h2 style={sectionTitle}>Deine Rechte</h2>
        <p style={textPre}>{`Du hast das Recht auf Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung und Datenübertragbarkeit. Beschwerden kannst du bei der zuständigen Datenschutzbehörde einreichen.
Kontakt: kontakt@saka-it.de`}</p>

        <h2 style={sectionTitle}>Sicherheit</h2>
        <p style={text}>
          Diese Website nutzt TLS/HTTPS-Verschlüsselung. Unser Server steht in Deutschland und unterliegt der DSGVO.
        </p>

        <h2 style={sectionTitle}>Änderungen</h2>
        <p style={text}>
          Wir behalten uns vor, diese Datenschutzerklärung anzupassen. Die aktuelle Version ist stets auf dieser Seite verfügbar.
        </p>
      </div>
    </main>
  );
}

export default Datenschutz;
