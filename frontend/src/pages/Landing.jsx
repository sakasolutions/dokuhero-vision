import { useEffect, useState } from 'react';

export default function Landing() {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(max-width: 640px)').matches : false
  );

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    const handler = () => setIsMobile(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const headlineFontSize = isMobile ? '36px' : '52px';

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #0f0c29, #1a1560, #6366f1)',
        color: '#fff',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          margin: '12px 16px 0',
          borderRadius: '14px',
          background: 'rgba(255,255,255,0.08)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxSizing: 'border-box',
          maxWidth: '1120px',
          width: 'calc(100% - 32px)',
          alignSelf: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
              boxShadow: '0 4px 14px rgba(0,0,0,0.25)',
            }}
          >
            D
          </div>
          <span style={{ fontSize: '17px', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
            DokuHero
          </span>
        </div>
        <button
          type="button"
          onClick={() => {
            window.location.href = '/api/auth/google';
          }}
          style={{
            border: '1px solid rgba(255,255,255,0.35)',
            background: 'rgba(255,255,255,0.12)',
            color: '#fff',
            fontWeight: 600,
            fontSize: '14px',
            padding: '10px 18px',
            borderRadius: '12px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            backdropFilter: 'blur(8px)',
          }}
        >
          Anmelden
        </button>
      </nav>

      <main
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 24px 48px',
          textAlign: 'center',
          boxSizing: 'border-box',
        }}
      >
        <h1
          style={{
            margin: 0,
            fontSize: headlineFontSize,
            fontWeight: 800,
            lineHeight: 1.12,
            color: '#fff',
            maxWidth: '720px',
          }}
        >
          Deine Dokumente.
          <br />
          Organisiert.{' '}
          <span style={{ color: '#a5b4fc' }}>Sofort.</span>
        </h1>

        <p
          style={{
            margin: '20px 0 0',
            fontSize: '18px',
            color: 'rgba(255,255,255,0.7)',
            maxWidth: '520px',
            lineHeight: 1.5,
          }}
        >
          Foto machen → KI erkennt alles → automatisch abgelegt
        </p>

        <button
          type="button"
          onClick={() => {
            window.location.href = '/api/auth/google';
          }}
          style={{
            marginTop: '32px',
            border: 'none',
            background: '#ffffff',
            color: '#4338ca',
            fontWeight: 700,
            fontSize: '16px',
            padding: '16px 32px',
            borderRadius: '14px',
            cursor: 'pointer',
            fontFamily: 'inherit',
            boxShadow: '0 12px 40px rgba(0,0,0,0.22), 0 2px 8px rgba(99,102,241,0.35)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.98)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = '';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = '';
            e.currentTarget.style.boxShadow =
              '0 12px 40px rgba(0,0,0,0.22), 0 2px 8px rgba(99,102,241,0.35)';
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow =
              '0 18px 48px rgba(0,0,0,0.28), 0 4px 16px rgba(99,102,241,0.45)';
          }}
        >
          Kostenlos starten — 5 Scans gratis
        </button>

        <p
          style={{
            margin: '18px 0 0',
            fontSize: '13px',
            color: 'rgba(255,255,255,0.5)',
            lineHeight: 1.5,
          }}
        >
          Kein Kreditkarte nötig · DSGVO-konform · Made in Germany 🇩🇪
        </p>

        <div
          style={{
            marginTop: 'auto',
            paddingTop: '48px',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            width: '100%',
            maxWidth: '900px',
          }}
        >
          {['📸 Foto scannen', '🤖 KI erkennt alles', '📁 Auto-abgelegt'].map((label) => (
            <span
              key={label}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '999px',
                padding: '10px 20px',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                boxSizing: 'border-box',
                width: isMobile ? '100%' : 'auto',
                maxWidth: isMobile ? '320px' : 'none',
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </main>
    </div>
  );
}
