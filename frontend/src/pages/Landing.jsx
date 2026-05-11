import { useEffect, useState } from 'react';

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

  const headlineFontSize = isMobile ? '38px' : '56px';

  const scrollToHowItWorks = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
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
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '12px',
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
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
            onClick={() => {
              window.location.href = '/api/auth/google';
            }}
            style={{
              border: '1px solid #e5e7eb',
              background: 'transparent',
              color: '#374151',
              fontWeight: 600,
              fontSize: '14px',
              padding: '10px 16px',
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
              fontSize: '14px',
              padding: '10px 18px',
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
        <section
          style={{
            padding: '60px 24px',
            textAlign: 'center',
            position: 'relative',
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
                fontFamily: "Georgia, 'Times New Roman', Times, serif",
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
              alignItems: 'center',
              justifyContent: 'center',
              gap: '14px',
            }}
          >
            <button
              type="button"
              style={btnPrimary}
              onClick={() => {
                window.location.href = '/api/auth/google';
              }}
            >
              Kostenlos starten
            </button>
            <button type="button" style={btnSecondary} onClick={scrollToHowItWorks}>
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
            Kein Kreditkarte · DSGVO-konform · Made in Germany 🇩🇪
          </p>
        </section>

        <div
          id="how-it-works"
          style={{
            scrollMarginTop: '24px',
            minHeight: '40px',
          }}
          aria-hidden="true"
        />
      </main>
    </div>
  );
}
