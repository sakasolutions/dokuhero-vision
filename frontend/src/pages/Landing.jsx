import { useEffect, useState } from 'react';

const SERIF = "Georgia, 'Times New Roman', Times, serif";

export default function Landing() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 768px)').matches : false
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 768px)');
    const handler = () => setIsMobile(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const headlineSize = isMobile ? '38px' : '56px';

  const goOAuth = () => {
    window.location.href = '/api/auth/google';
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #f0f0ff 0%, #e8e8ff 40%, #f5f0ff 100%)',
        color: '#111827',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {/* ——— Header / Navbar ——— */}
      <header
        style={{
          position: 'sticky',
          top: '12px',
          zIndex: 40,
          maxWidth: '1100px',
          width: 'calc(100% - 24px)',
          margin: '12px auto 0',
          boxSizing: 'border-box',
        }}
      >
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            flexWrap: isMobile ? 'wrap' : 'nowrap',
            padding: '14px 18px',
            borderRadius: '16px',
            background: '#ffffff',
            boxShadow: '0 4px 24px rgba(15, 10, 46, 0.06)',
            border: '1px solid rgba(229, 231, 235, 0.95)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              minWidth: 0,
              flex: isMobile ? '1 1 auto' : '0 1 auto',
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={goOAuth}
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
              onClick={goOAuth}
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
      </header>

      {/* ——— Hero ——— */}
      <section
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: isMobile ? '40px 24px 56px' : '56px 24px 72px',
          textAlign: 'center',
          boxSizing: 'border-box',
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
            background: 'rgba(255,255,255,0.55)',
          }}
        >
          ✦ KI-gestützte Dokumentenverwaltung
        </span>

        <div
          style={{
            position: 'relative',
            maxWidth: '920px',
            margin: '28px auto 0',
            minHeight: isMobile ? 'auto' : '168px',
          }}
        >
          {!isMobile ? (
            <>
              <div
                style={{
                  position: 'absolute',
                  left: '0',
                  top: '10%',
                  maxWidth: '236px',
                  padding: '14px 16px',
                  background: '#ffffff',
                  borderRadius: '12px',
                  boxShadow: '0 12px 40px rgba(15, 10, 46, 0.1)',
                  border: '1px solid rgba(229, 231, 235, 0.95)',
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
                  top: '30%',
                  maxWidth: '258px',
                  padding: '14px 16px',
                  background: '#ffffff',
                  borderRadius: '12px',
                  boxShadow: '0 12px 40px rgba(15, 10, 46, 0.1)',
                  border: '1px solid rgba(229, 231, 235, 0.95)',
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
              padding: isMobile ? '0 4px' : '0 196px',
              fontFamily: SERIF,
              fontSize: headlineSize,
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
            marginTop: '32px',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: 'stretch',
            justifyContent: 'center',
            gap: '12px',
            maxWidth: '400px',
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          <button
            type="button"
            onClick={goOAuth}
            style={{
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
              width: isMobile ? '100%' : 'auto',
            }}
          >
            Kostenlos starten
          </button>
          <button
            type="button"
            onClick={() =>
              document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
            }
            style={{
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
              width: isMobile ? '100%' : 'auto',
            }}
          >
            Wie funktioniert&apos;s?
          </button>
        </div>

        <p
          style={{
            margin: '24px 0 0',
            fontSize: '14px',
            color: '#9ca3af',
            fontWeight: 500,
          }}
        >
          Keine Kreditkarte · DSGVO-konform · Made in Germany 🇩🇪
        </p>
      </section>

      {/* Anker für nächste Sektion („So funktioniert&apos;s“) */}
      <div id="how-it-works" style={{ scrollMarginTop: '96px' }} aria-hidden="true" />
    </div>
  );
}
