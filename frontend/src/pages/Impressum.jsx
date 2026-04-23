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

function Impressum() {
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
            margin: '0 0 0',
            fontSize: '28px',
            fontWeight: 700,
            color: '#111827',
            lineHeight: 1.2,
          }}
        >
          Impressum
        </h1>

        <h2 style={{ ...sectionTitle, marginTop: '32px' }}>Angaben gemäß § 5 TMG</h2>
        <p
          style={text}
        >{`SAKA Solutions – IT & Webdesign
Inhaber: Sinan Sakacilar
Esslinger Str. 15
89537 Giengen an der Brenz
Deutschland

Telefon: +49 1522 6396063
E-Mail: kontakt@saka-it.de`}</p>

        <h2 style={sectionTitle}>Umsatzsteuer-ID</h2>
        <p style={text}>DE456172594</p>

        <h2 style={sectionTitle}>Verantwortlich i. S. d. § 18 Abs. 2 MStV</h2>
        <p
          style={text}
        >{`Sinan Sakacilar
Esslinger Str. 15
89537 Giengen an der Brenz`}</p>

        <h2 style={sectionTitle}>Haftung für Inhalte</h2>
        <p style={text}>
          Als Diensteanbieter sind wir für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Wir übernehmen
          keine Gewähr für Vollständigkeit, Richtigkeit und Aktualität.
        </p>

        <h2 style={sectionTitle}>Haftung für Links</h2>
        <p style={text}>
          Unsere Seiten enthalten Links zu externen Websites, auf deren Inhalte wir keinen Einfluss haben. Für diese Inhalte ist stets
          der jeweilige Anbieter verantwortlich.
        </p>

        <h2 style={sectionTitle}>Urheberrecht</h2>
        <p style={text}>
          Alle Inhalte dieser Website unterliegen dem deutschen Urheberrecht. Jede Verwertung außerhalb der Grenzen des Urheberrechts
          bedarf der Zustimmung des Rechteinhabers.
        </p>

        <h2 style={sectionTitle}>Online-Streitbeilegung</h2>
        <p style={text}>
          Wir sind nicht verpflichtet und nicht bereit, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
        </p>
      </div>
    </main>
  );
}

export default Impressum;
