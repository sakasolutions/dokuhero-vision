import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

const SERIF = "Georgia, 'Times New Roman', Times, serif";

export default function Landing() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 768px)').matches : false
  );
  const [faqOpen, setFaqOpen] = useState(null);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = () => setIsMobile(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const headlineFontSize = isMobile ? '38px' : '56px';

  const scrollToId = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const btnPrimary = {
    border: 'none',
    background: '#6366f1',
    color: '#fff',
    fontWeight: 700,
    fontSize: '16px',
    padding: '16px 28px',
    borderRadius: '12px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 8px 24px rgba(99, 102, 241, 0.35)',
  };

  const btnSecondary = {
    border: '1px solid #e5e7eb',
    background: '#ffffff',
    color: '#374151',
    fontWeight: 700,
    fontSize: '16px',
    padding: '16px 28px',
    borderRadius: '12px',
    cursor: 'pointer',
    fontFamily: 'inherit',
    boxShadow: '0 2px 8px rgba(15, 10, 46, 0.06)',
  };

  const sectionShell = {
    maxWidth: '1100px',
    marginLeft: 'auto',
    marginRight: 'auto',
    paddingLeft: '24px',
    paddingRight: '24px',
    boxSizing: 'border-box',
  };

  const faqItems = [
    {
      q: 'Wo werden meine Dokumente gespeichert?',
      a: 'Du entscheidest: z. B. Google Drive oder Hetzner Tresor (S3). Wir halten die Daten in deinem Konto — DokuHero ist die intelligente Schicht darüber.',
    },
    {
      q: 'Ist DokuHero DSGVO-konform?',
      a: 'Wir verarbeiten Daten zweckgebunden für die von dir genutzten Funktionen. Details stehen in der Datenschutzerklärung — Hosting und Anbieter sollten in Deutschland bzw. EU erfolgen.',
    },
    {
      q: 'Brauche ich eine Kreditkarte?',
      a: 'Nein. Du kannst mit den kostenlosen Scans starten — ohne Zahlungsmittel.',
    },
    {
      q: 'Welche Dateiformate unterstützt ihr?',
      a: 'Typischerweise Fotos (z. B. JPG/PNG), Heic sowie PDFs — ideal für Belege, Verträge und Post.',
    },
    {
      q: 'Erkennt die KI auch Beträge und Fristen?',
      a: 'Ja — relevante Felder wie Betrag, Datum und Fristen können extrahiert werden; optional kannst du dich erinnern lassen.',
    },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #f0f0ff 0%, #e8e8ff 40%, #f5f0ff 100%)',
        color: '#111827',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <nav
        style={{
          position: 'sticky',
          top: '12px',
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
          flexWrap: isMobile ? 'wrap' : 'nowrap',
          padding: '14px 20px',
          margin: '12px',
          borderRadius: '16px',
          background: '#ffffff',
          boxShadow: '0 4px 24px rgba(15, 10, 46, 0.06)',
          border: '1px solid rgba(229, 231, 235, 0.9)',
          boxSizing: 'border-box',
          maxWidth: '1100px',
          width: 'calc(100% - 24px)',
          marginLeft: 'auto',
          marginRight: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            minWidth: 0,
            flex: isMobile ? '1 1 100%' : '0 1 auto',
            justifyContent: isMobile ? 'center' : 'flex-start',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              backgroundColor: '#6366f1',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 800,
              fontSize: '22px',
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            D
          </div>
          <span style={{ fontSize: '17px', fontWeight: 700, color: '#0f0a2e', letterSpacing: '-0.02em' }}>
            DokuHero
          </span>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            flexShrink: 0,
            flex: isMobile ? '1 1 100%' : '0 0 auto',
            justifyContent: isMobile ? 'center' : 'flex-end',
          }}
        >
          <button
            type="button"
            onClick={() => {
              window.location.href = '/api/auth/google';
            }}
            style={{
              border: '1px solid #e5e7eb',
              background: 'transparent',
              color: '#374151',
              fontWeight: 600,
              fontSize: isMobile ? '13px' : '14px',
              padding: isMobile ? '9px 14px' : '10px 16px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontFamily: 'inherit',
            }}
          >
            Anmelden
          </button>
          <button
            type="button"
            onClick={() => {
              window.location.href = '/api/auth/google';
            }}
            style={{
              border: 'none',
              background: '#6366f1',
              color: '#fff',
              fontWeight: 600,
              fontSize: isMobile ? '13px' : '14px',
              padding: isMobile ? '9px 16px' : '10px 18px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
            }}
          >
            Kostenlos starten
          </button>
        </div>
      </nav>

      <main>
        {/* ——— Hero ——— */}
        <section
          style={{
            padding: isMobile ? '40px 24px 56px' : '60px 24px 72px',
            textAlign: 'center',
            position: 'relative',
            ...sectionShell,
          }}
        >
          <span
            style={{
              display: 'inline-block',
              padding: '8px 16px',
              borderRadius: '999px',
              border: '1px solid #6366f1',
              color: '#4338ca',
              fontSize: '13px',
              fontWeight: 600,
              background: 'rgba(255,255,255,0.65)',
            }}
          >
            ✦ KI-gestützte Dokumentenverwaltung
          </span>

          <div
            style={{
              position: 'relative',
              maxWidth: '920px',
              margin: '28px auto 0',
              minHeight: isMobile ? 'auto' : '180px',
            }}
          >
            {!isMobile ? (
              <>
                <div
                  style={{
                    position: 'absolute',
                    left: '0',
                    top: '8%',
                    maxWidth: '240px',
                    padding: '14px 16px',
                    background: '#ffffff',
                    borderRadius: '12px',
                    boxShadow: '0 12px 40px rgba(15, 10, 46, 0.1)',
                    border: '1px solid rgba(229, 231, 235, 0.9)',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#374151',
                    textAlign: 'left',
                    zIndex: 2,
                  }}
                >
                  📄 Rechnung erkannt · IHK · €1.460
                </div>
                <div
                  style={{
                    position: 'absolute',
                    right: '0',
                    top: '28%',
                    maxWidth: '260px',
                    padding: '14px 16px',
                    background: '#ffffff',
                    borderRadius: '12px',
                    boxShadow: '0 12px 40px rgba(15, 10, 46, 0.1)',
                    border: '1px solid rgba(229, 231, 235, 0.9)',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#374151',
                    textAlign: 'left',
                    zIndex: 2,
                  }}
                >
                  ⏰ Frist: 3. Juni 2026 · Erinnerung gesetzt ✓
                </div>
              </>
            ) : null}

            <h1
              style={{
                margin: 0,
                padding: isMobile ? '0 8px' : '0 200px',
                fontFamily: SERIF,
                fontSize: headlineFontSize,
                fontWeight: 800,
                lineHeight: 1.08,
                color: '#0f0a2e',
                position: 'relative',
                zIndex: 1,
              }}
            >
              Nie wieder Dokumente
              <br />
              suchen.
            </h1>
          </div>

          <p
            style={{
              margin: '24px auto 0',
              fontSize: '18px',
              color: '#6b7280',
              maxWidth: '520px',
              lineHeight: 1.55,
            }}
          >
            Foto machen, KI erkennt den Rest. Automatisch sortiert, durchsuchbar, sicher in Deutschland
            gespeichert.
          </p>

          <div
            style={{
              marginTop: '36px',
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: 'stretch',
              justifyContent: 'center',
              gap: '14px',
              maxWidth: '420px',
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            <button
              type="button"
              style={{ ...btnPrimary, width: isMobile ? '100%' : 'auto' }}
              onClick={() => {
                window.location.href = '/api/auth/google';
              }}
            >
              Kostenlos starten
            </button>
            <button
              type="button"
              style={{ ...btnSecondary, width: isMobile ? '100%' : 'auto' }}
              onClick={() => scrollToId('how-it-works')}
            >
              Wie funktioniert&apos;s?
            </button>
          </div>

          <p
            style={{
              margin: '28px 0 0',
              fontSize: '14px',
              color: '#9ca3af',
              fontWeight: 500,
            }}
          >
            Keine Kreditkarte · DSGVO-konform · Made in Germany 🇩🇪
          </p>
        </section>

        {/* ——— How it works ——— */}
        <section
          id="how-it-works"
          style={{
            scrollMarginTop: '88px',
            padding: '56px 0 64px',
            ...sectionShell,
          }}
        >
          <h2
            style={{
              margin: '0 0 12px',
              textAlign: 'center',
              fontFamily: SERIF,
              fontSize: isMobile ? '28px' : '34px',
              fontWeight: 800,
              color: '#0f0a2e',
            }}
          >
            So funktioniert&apos;s
          </h2>
          <p
            style={{
              margin: '0 auto 40px',
              textAlign: 'center',
              fontSize: '17px',
              color: '#6b7280',
              maxWidth: '560px',
              lineHeight: 1.5,
            }}
          >
            Drei klare Schritte — vom Foto bis zur abgelegten Datei.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: '20px',
            }}
          >
            {[
              {
                step: '1',
                title: 'Erfassen',
                text: 'Foto, Scan oder PDF hochladen — auch mehrseitig.',
                icon: '📸',
              },
              {
                step: '2',
                title: 'Verstehen',
                text: 'Die KI liest Typ, Absender, Beträge und erkennt Fristen.',
                icon: '🤖',
              },
              {
                step: '3',
                title: 'Ablegen',
                text: 'Automatisch sortiert, durchsuchbar — bei dir im Speicher.',
                icon: '📁',
              },
            ].map((item) => (
              <div
                key={item.step}
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  padding: '28px 24px',
                  border: '1px solid rgba(229, 231, 235, 0.95)',
                  boxShadow: '0 8px 32px rgba(15, 10, 46, 0.06)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '36px', lineHeight: 1, marginBottom: '12px' }}>{item.icon}</div>
                <div
                  style={{
                    display: 'inline-block',
                    padding: '4px 12px',
                    borderRadius: '999px',
                    background: '#eef2ff',
                    color: '#4338ca',
                    fontSize: '12px',
                    fontWeight: 700,
                    marginBottom: '12px',
                  }}
                >
                  Schritt {item.step}
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: '18px', fontWeight: 700, color: '#0f0a2e' }}>
                  {item.title}
                </h3>
                <p style={{ margin: 0, fontSize: '15px', color: '#6b7280', lineHeight: 1.55 }}>{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ——— Trust ——— */}
        <section
          style={{
            padding: '0 0 64px',
            ...sectionShell,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '16px',
              padding: isMobile ? '24px 20px' : '28px 32px',
              border: '1px solid rgba(229, 231, 235, 0.95)',
              boxShadow: '0 4px 24px rgba(15, 10, 46, 0.05)',
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: 'center',
              justifyContent: 'center',
              gap: isMobile ? '16px' : '40px',
              flexWrap: 'wrap',
            }}
          >
            {[
              { icon: '🇩🇪', label: 'Fokus Deutschland & EU' },
              { icon: '🔒', label: 'DSGVO-orientierte Verarbeitung' },
              { icon: '✓', label: 'Keine Kreditkarte zum Start' },
            ].map((row) => (
              <div
                key={row.label}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#374151', fontWeight: 600, fontSize: '15px' }}
              >
                <span style={{ fontSize: '20px' }}>{row.icon}</span>
                {row.label}
              </div>
            ))}
          </div>
        </section>

        {/* ——— Features ——— */}
        <section
          id="features"
          style={{
            scrollMarginTop: '80px',
            padding: '0 0 72px',
            ...sectionShell,
          }}
        >
          <h2
            style={{
              margin: '0 0 12px',
              textAlign: 'center',
              fontFamily: SERIF,
              fontSize: isMobile ? '28px' : '34px',
              fontWeight: 800,
              color: '#0f0a2e',
            }}
          >
            Was DokuHero kann
          </h2>
          <p
            style={{
              margin: '0 auto 40px',
              textAlign: 'center',
              fontSize: '17px',
              color: '#6b7280',
              maxWidth: '560px',
            }}
          >
            Alles, was du für den Papierkram im Alltag brauchst — ohne Ordner-Chaos.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)',
              gap: '20px',
            }}
          >
            {[
              {
                title: 'Smarte Ablage',
                desc: 'Kategorie und Absender werden erkannt — du musst nichts manuell sortieren.',
              },
              {
                title: 'Volltextsuche',
                desc: 'Finde Belege über OCR-Text — auch wenn der Dateiname nichts sagt.',
              },
              {
                title: 'Fristen & Erinnerungen',
                desc: 'Wichtige Termine erkennen und optional per Erinnerung nicht verpassen.',
              },
              {
                title: 'Dein Speicher',
                desc: 'Anbindung an Google Drive oder Hetzner Tresor — Daten bleiben bei dir.',
              },
            ].map((f) => (
              <div
                key={f.title}
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  padding: '24px 22px',
                  border: '1px solid rgba(229, 231, 235, 0.95)',
                  boxShadow: '0 6px 28px rgba(15, 10, 46, 0.06)',
                }}
              >
                <div
                  style={{
                    width: '40px',
                    height: '40px',
                    borderRadius: '10px',
                    background: '#eef2ff',
                    display: 'grid',
                    placeItems: 'center',
                    marginBottom: '14px',
                  }}
                >
                  <span style={{ color: '#6366f1', fontWeight: 800 }}>✦</span>
                </div>
                <h3 style={{ margin: '0 0 8px', fontSize: '17px', fontWeight: 700, color: '#0f0a2e' }}>{f.title}</h3>
                <p style={{ margin: 0, fontSize: '15px', color: '#6b7280', lineHeight: 1.55 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ——— FAQ ——— */}
        <section
          id="faq"
          style={{
            scrollMarginTop: '80px',
            padding: '0 0 80px',
            ...sectionShell,
          }}
        >
          <h2
            style={{
              margin: '0 0 12px',
              textAlign: 'center',
              fontFamily: SERIF,
              fontSize: isMobile ? '28px' : '34px',
              fontWeight: 800,
              color: '#0f0a2e',
            }}
          >
            Häufige Fragen
          </h2>
          <p
            style={{
              margin: '0 auto 32px',
              textAlign: 'center',
              fontSize: '17px',
              color: '#6b7280',
              maxWidth: '520px',
            }}
          >
            Kurz beantwortet — bei Detailfragen hilft uns der Support gern.
          </p>

          <div style={{ maxWidth: '720px', margin: '0 auto' }}>
            {faqItems.map((item, i) => {
              const open = faqOpen === i;
              return (
                <div
                  key={item.q}
                  style={{
                    marginBottom: '10px',
                    borderRadius: '14px',
                    border: '1px solid rgba(229, 231, 235, 0.95)',
                    background: '#ffffff',
                    overflow: 'hidden',
                    boxShadow: '0 2px 12px rgba(15, 10, 46, 0.04)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setFaqOpen(open ? null : i)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '16px',
                      padding: '18px 20px',
                      border: 'none',
                      background: 'transparent',
                      cursor: 'pointer',
                      textAlign: 'left',
                      fontFamily: 'inherit',
                      fontSize: '16px',
                      fontWeight: 600,
                      color: '#0f0a2e',
                    }}
                  >
                    <span>{item.q}</span>
                    <span style={{ color: '#6366f1', fontSize: '20px', flexShrink: 0 }}>{open ? '−' : '+'}</span>
                  </button>
                  {open ? (
                    <div
                      style={{
                        padding: '0 20px 18px',
                        fontSize: '15px',
                        color: '#6b7280',
                        lineHeight: 1.6,
                      }}
                    >
                      {item.a}
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        {/* ——— Final CTA ——— */}
        <section style={{ padding: '0 24px 56px', ...sectionShell }}>
          <div
            style={{
              borderRadius: '20px',
              padding: isMobile ? '36px 24px' : '44px 40px',
              textAlign: 'center',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              boxShadow: '0 20px 50px rgba(79, 70, 229, 0.35)',
            }}
          >
            <h2
              style={{
                margin: '0 0 10px',
                fontFamily: SERIF,
                fontSize: isMobile ? '26px' : '30px',
                fontWeight: 800,
                color: '#ffffff',
              }}
            >
              Bereit für weniger Chaos?
            </h2>
            <p style={{ margin: '0 0 24px', fontSize: '16px', color: 'rgba(255,255,255,0.88)', maxWidth: '440px', marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.5 }}>
              Starte mit kostenlosen Scans — mit Google anmelden und direkt ausprobieren.
            </p>
            <button
              type="button"
              onClick={() => {
                window.location.href = '/api/auth/google';
              }}
              style={{
                border: 'none',
                background: '#ffffff',
                color: '#4338ca',
                fontWeight: 700,
                fontSize: '16px',
                padding: '16px 32px',
                borderRadius: '12px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: '0 8px 28px rgba(0,0,0,0.15)',
              }}
            >
              Mit Google starten
            </button>
          </div>
        </section>

        {/* ——— Footer ——— */}
        <footer
          style={{
            padding: '28px 24px 40px',
            borderTop: '1px solid rgba(229, 231, 235, 0.9)',
            background: 'rgba(255,255,255,0.5)',
          }}
        >
          <div
            style={{
              maxWidth: '1100px',
              margin: '0 auto',
              display: 'flex',
              flexDirection: isMobile ? 'column' : 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '8px',
                  backgroundColor: '#6366f1',
                  color: '#fff',
                  display: 'grid',
                  placeItems: 'center',
                  fontWeight: 800,
                  fontSize: '16px',
                }}
              >
                D
              </div>
              <span style={{ fontWeight: 700, color: '#0f0a2e' }}>DokuHero</span>
            </div>
            <nav style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center' }}>
              <Link to="/impressum" style={{ color: '#6b7280', fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}>
                Impressum
              </Link>
              <Link to="/datenschutz" style={{ color: '#6b7280', fontSize: '14px', fontWeight: 500, textDecoration: 'none' }}>
                Datenschutz
              </Link>
              <button
                type="button"
                onClick={() => scrollToId('faq')}
                style={{
                  border: 'none',
                  background: 'none',
                  padding: 0,
                  cursor: 'pointer',
                  color: '#6b7280',
                  fontSize: '14px',
                  fontWeight: 500,
                  fontFamily: 'inherit',
                }}
              >
                FAQ
              </button>
            </nav>
            <p style={{ margin: 0, fontSize: '13px', color: '#9ca3af' }}>© {new Date().getFullYear()} DokuHero</p>
          </div>
        </footer>
      </main>
    </div>
  );
}
