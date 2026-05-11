/**
 * Landing — nur Header + Hero. Bewusst reduziert: System-Sans, kaum Dekoration.
 */

import { useEffect, useState } from 'react';

const FONT =
  'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

export default function Landing() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(min-width: 1024px)').matches : false
  );

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const handler = () => setIsDesktop(mq.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

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
          maxWidth: isDesktop ? '1040px' : '640px',
          margin: '0 auto',
          padding: 'clamp(48px, 12vw, 88px) 24px 80px',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: isDesktop ? 'row' : 'column',
            alignItems: isDesktop ? 'center' : 'stretch',
            justifyContent: 'space-between',
            gap: isDesktop ? '56px' : '0px',
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
        <p
          style={{
            margin: 0,
            fontSize: '13px',
            fontWeight: 500,
            color: '#64748b',
            letterSpacing: '0.04em',
            textTransform: 'uppercase',
            textAlign: isDesktop ? 'left' : 'center',
          }}
        >
          Dokumente mit KI
        </p>

        <h1
          style={{
            margin: '20px 0 0',
            textAlign: isDesktop ? 'left' : 'center',
            fontSize: isDesktop ? '54px' : 'clamp(2rem, 7vw, 2.875rem)',
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
            textAlign: isDesktop ? 'left' : 'center',
            fontSize: '17px',
            fontWeight: 400,
            color: '#64748b',
            lineHeight: 1.55,
            maxWidth: isDesktop ? '520px' : '480px',
          }}
        >
          Foto oder PDF — die KI erkennt Inhalt und Ordner. Sortiert, durchsuchbar, bei dir gespeichert.
        </p>

        <div
          style={{
            marginTop: '36px',
            display: 'flex',
            flexDirection: isDesktop ? 'row' : 'column',
            alignItems: isDesktop ? 'center' : 'stretch',
            gap: '10px',
            maxWidth: isDesktop ? '520px' : '340px',
            marginLeft: isDesktop ? 0 : 'auto',
            marginRight: isDesktop ? 0 : 'auto',
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
              flex: isDesktop ? '0 0 auto' : '0 0 auto',
            }}
          >
            Mit Google fortfahren
          </button>
          <button
            type="button"
            onClick={scrollHow}
            style={{
              border: isDesktop ? '1px solid rgba(15, 23, 42, 0.10)' : 'none',
              background: isDesktop ? '#fff' : 'transparent',
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
            textAlign: isDesktop ? 'left' : 'center',
            fontSize: '12px',
            fontWeight: 400,
            color: '#94a3b8',
            lineHeight: 1.5,
          }}
        >
          Keine Kreditkarte · DSGVO · Deutschland 🇩🇪
        </p>
          </div>

          {isDesktop ? (
            <div style={{ width: '420px', flexShrink: 0 }}>
              <div
                style={{
                  background: '#ffffff',
                  border: '1px solid rgba(15, 23, 42, 0.08)',
                  borderRadius: '16px',
                  boxShadow: '0 18px 50px rgba(15, 23, 42, 0.08)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '14px 14px 10px',
                    borderBottom: '1px solid rgba(15, 23, 42, 0.06)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '10px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '8px',
                        background: '#6366f1',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: '15px',
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0,
                      }}
                    >
                      D
                    </div>
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a', whiteSpace: 'nowrap' }}>
                      Upload
                    </span>
                  </div>
                  <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 500 }}>Live Preview</span>
                </div>

                <div style={{ padding: '14px' }}>
                  <div
                    style={{
                      background: '#f8fafc',
                      border: '1px solid rgba(15, 23, 42, 0.06)',
                      borderRadius: '14px',
                      padding: '14px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                          Rechnung · IHK
                        </p>
                        <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#64748b' }}>
                          Betrag erkannt: € 1.460 · Frist: 03.06
                        </p>
                      </div>
                      <span
                        style={{
                          fontSize: '12px',
                          color: '#16a34a',
                          fontWeight: 700,
                          background: 'rgba(34,197,94,0.10)',
                          border: '1px solid rgba(34,197,94,0.25)',
                          padding: '6px 10px',
                          borderRadius: '999px',
                          flexShrink: 0,
                        }}
                      >
                        Abgelegt ✓
                      </span>
                    </div>
                  </div>

                  <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div
                      style={{
                        border: '1px solid rgba(15, 23, 42, 0.06)',
                        background: '#fff',
                        borderRadius: '14px',
                        padding: '12px',
                      }}
                    >
                      <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Kategorie</p>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                        Rechnungen
                      </p>
                    </div>
                    <div
                      style={{
                        border: '1px solid rgba(15, 23, 42, 0.06)',
                        background: '#fff',
                        borderRadius: '14px',
                        padding: '12px',
                      }}
                    >
                      <p style={{ margin: 0, fontSize: '12px', color: '#64748b' }}>Speicher</p>
                      <p style={{ margin: '4px 0 0', fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>
                        Drive / Tresor
                      </p>
                    </div>
                  </div>

                  <div style={{ marginTop: '12px', height: '10px', borderRadius: '999px', background: '#eef2ff' }}>
                    <div
                      style={{
                        width: '62%',
                        height: '100%',
                        borderRadius: '999px',
                        background: '#6366f1',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </main>

      <div id="how-it-works" style={{ scrollMarginTop: '72px' }} aria-hidden="true" />
    </div>
  );
}
