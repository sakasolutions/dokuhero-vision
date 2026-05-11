/**
 * Landing — nur Header + Hero. Bewusst reduziert: System-Sans, kaum Dekoration.
 */

const FONT =
  'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export default function Landing() {
  const goOAuth = () => {
    window.location.href = '/api/auth/google';
  };

  const scrollHow = () => {
    document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f6f7f9',
        color: '#0f172a',
        fontFamily: FONT,
        WebkitFontSmoothing: 'antialiased',
      }}
    >
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          borderBottom: '1px solid rgba(15, 23, 42, 0.06)',
          background: 'rgba(255,255,255,0.86)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
        }}
      >
        <div
          style={{
            maxWidth: '1040px',
            margin: '0 auto',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '16px',
            boxSizing: 'border-box',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: '#6366f1',
                color: '#fff',
                fontWeight: 700,
                fontSize: '17px',
                display: 'grid',
                placeItems: 'center',
                flexShrink: 0,
              }}
            >
              D
            </div>
            <span style={{ fontSize: '15px', fontWeight: 600, color: '#0f172a', letterSpacing: '-0.02em' }}>
              DokuHero
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            <button
              type="button"
              onClick={goOAuth}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#475569',
                fontWeight: 500,
                fontSize: '14px',
                padding: '8px 10px',
                borderRadius: '8px',
                cursor: 'pointer',
                fontFamily: FONT,
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
                fontSize: '14px',
                padding: '9px 16px',
                borderRadius: '9px',
                cursor: 'pointer',
                fontFamily: FONT,
              }}
            >
              Starten
            </button>
          </div>
        </div>
      </header>

      <main
        style={{
          maxWidth: '640px',
          margin: '0 auto',
          padding: 'clamp(48px, 12vw, 88px) 24px 80px',
          boxSizing: 'border-box',
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: '13px',
            fontWeight: 500,
            color: '#64748b',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            textAlign: 'center',
          }}
        >
          Dokumente mit KI
        </p>

        <h1
          style={{
            margin: '20px 0 0',
            textAlign: 'center',
            fontSize: 'clamp(2rem, 7vw, 2.875rem)',
            fontWeight: 600,
            letterSpacing: '-0.038em',
            lineHeight: 1.12,
            color: '#0f172a',
          }}
        >
          Nie wieder Dokumente suchen.
        </h1>

        <p
          style={{
            margin: '20px auto 0',
            textAlign: 'center',
            fontSize: '17px',
            fontWeight: 400,
            color: '#64748b',
            lineHeight: 1.55,
            maxWidth: '480px',
          }}
        >
          Foto oder PDF — die KI erkennt Inhalt und Ordner. Sortiert, durchsuchbar, bei dir gespeichert.
        </p>

        <div
          style={{
            marginTop: '36px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
            gap: '10px',
            maxWidth: '340px',
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
              fontWeight: 600,
              fontSize: '15px',
              padding: '14px 22px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontFamily: FONT,
            }}
          >
            Mit Google fortfahren
          </button>
          <button
            type="button"
            onClick={scrollHow}
            style={{
              border: 'none',
              background: 'transparent',
              color: '#475569',
              fontWeight: 500,
              fontSize: '15px',
              padding: '12px 16px',
              borderRadius: '10px',
              cursor: 'pointer',
              fontFamily: FONT,
            }}
          >
            Mehr erfahren
          </button>
        </div>

        <p
          style={{
            margin: '28px 0 0',
            textAlign: 'center',
            fontSize: '12px',
            fontWeight: 400,
            color: '#94a3b8',
            lineHeight: 1.5,
          }}
        >
          Keine Kreditkarte · DSGVO · Deutschland 🇩🇪
        </p>
      </main>

      <div id="how-it-works" style={{ scrollMarginTop: '72px' }} aria-hidden="true" />
    </div>
  );
}
