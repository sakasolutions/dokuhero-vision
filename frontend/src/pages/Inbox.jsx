import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import BottomNav from '../components/BottomNav';
import api from '../services/api';
import { clearClientSession, ensureSessionOrRedirect } from '../utils/session';

const LS_GMAIL = 'gmail_token';

function IconMailHeader({ size = 24, color = '#6366f1' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 6h16v12H4V6Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M4 8l8 6 8-6" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconLogoutDoor() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"
        stroke="#9ca3af"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M16 17l5-5-5-5M21 12H9"
        stroke="#9ca3af"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function attachKey(messageId, attachmentId) {
  return `${messageId}:${attachmentId}`;
}

export default function Inbox() {
  const navigate = useNavigate();
  const [emails, setEmails] = useState([]);
  const [loading, setLoading] = useState(() => !!localStorage.getItem(LS_GMAIL));
  const [error, setError] = useState('');
  const [hasGmail] = useState(() => !!localStorage.getItem(LS_GMAIL));
  /** @type {Record<string, { status: 'loading' | 'success' | 'error'; ordner?: string; message?: string }>} */
  const [processing, setProcessing] = useState({});

  useEffect(() => {
    let cancelled = false;

    if (!hasGmail) {
      return undefined;
    }

    void (async () => {
      const ok = await ensureSessionOrRedirect(navigate);
      if (!ok || cancelled) return;
      const gmailToken = localStorage.getItem(LS_GMAIL);

      try {
        const response = await api.get('/api/gmail/inbox', {
          headers: { Authorization: `Bearer ${gmailToken}` },
        });
        if (!cancelled) {
          setEmails(response.data?.emails || []);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e?.response?.data?.error || 'Posteingang konnte nicht geladen werden.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hasGmail, navigate]);

  const handleProcess = useCallback(async (messageId, attachmentId, filename) => {
    const gmailToken = localStorage.getItem(LS_GMAIL);
    if (!gmailToken) {
      return;
    }

    const key = attachKey(messageId, attachmentId);
    setProcessing((prev) => ({ ...prev, [key]: { status: 'loading' } }));
    try {
      const response = await api.post(
        '/api/gmail/process',
        {
          messageId,
          attachmentId,
          filename,
        },
        {
          headers: {
            'X-Gmail-Access-Token': gmailToken,
          },
        }
      );
      const ordner = response.data?.analysis?.ordner || 'Drive';
      setProcessing((prev) => ({ ...prev, [key]: { status: 'success', ordner } }));
    } catch (e) {
      const msg = e?.response?.data?.error || 'Fehler beim Ablegen';
      setProcessing((prev) => ({ ...prev, [key]: { status: 'error', message: msg } }));
    }
  }, []);

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: 'transparent',
        color: '#111827',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backgroundColor: 'rgba(255,255,255,0.82)',
          borderBottom: '1px solid rgba(17,24,39,0.08)',
          backdropFilter: 'blur(10px)',
        }}
      >
        <div
          style={{
            maxWidth: '480px',
            margin: '0 auto',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
            <IconMailHeader />
            <h1
              style={{
                margin: 0,
                fontSize: '17px',
                fontWeight: 600,
                color: '#111827',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              Gmail Posteingang
            </h1>
          </div>
          <button
            type="button"
            onClick={async () => {
              localStorage.removeItem(LS_GMAIL);
              localStorage.removeItem('gmail_refresh_token');
              await clearClientSession();
              window.location.href = '/';
            }}
            aria-label="Abmelden"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              border: '1px solid rgba(17,24,39,0.10)',
              background: 'rgba(255,255,255,0.6)',
              padding: 0,
              display: 'grid',
              placeItems: 'center',
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            <IconLogoutDoor />
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '16px 16px 80px' }}>
        {loading ? (
          <div
            style={{
              minHeight: '50vh',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '999px',
                border: '3px solid #e5e7eb',
                borderTopColor: '#6366f1',
                animation: 'inboxSpin 0.8s linear infinite',
                display: 'inline-block',
              }}
            />
            <style>{`
              @keyframes inboxSpin { to { transform: rotate(360deg); } }
            `}</style>
          </div>
        ) : null}

        {!loading && !hasGmail ? (
          <div
            style={{
              background: '#fff',
              border: '1px solid rgba(17,24,39,0.10)',
              borderRadius: '14px',
              padding: '18px 16px',
              textAlign: 'center',
              boxShadow: '0 8px 22px rgba(17,24,39,0.06)',
            }}
          >
            <p style={{ margin: 0, fontSize: '15px', color: '#374151', lineHeight: 1.5 }}>
              Verbinde Gmail, um deine E-Mails zu sehen.
            </p>
            <button
              type="button"
              onClick={() => navigate('/settings')}
              style={{
                marginTop: '16px',
                fontFamily: 'inherit',
                fontSize: '14px',
                fontWeight: 600,
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                padding: '12px 22px',
                minHeight: '48px',
                background: 'linear-gradient(135deg, rgba(99,102,241,1) 0%, rgba(79,70,229,1) 100%)',
                cursor: 'pointer',
                boxShadow: '0 14px 30px rgba(99,102,241,0.22)',
              }}
            >
              Zu Einstellungen
            </button>
          </div>
        ) : null}

        {!loading && hasGmail && error ? (
          <p style={{ margin: 0, textAlign: 'center', color: '#dc2626', fontSize: '14px' }}>{error}</p>
        ) : null}

        {!loading && hasGmail && !error ? (
          <>
            <div
              style={{
                background: 'rgba(99,102,241,0.08)',
                border: '1px solid rgba(99,102,241,0.18)',
                borderRadius: '12px',
                padding: '10px 14px',
                marginBottom: '14px',
                fontSize: '13px',
                color: '#4338ca',
                lineHeight: 1.45,
              }}
            >
              PDFs aus deinen letzten 30 Tagen. Tippe auf &quot;Ablegen&quot; um sie zu sortieren.
            </div>

            {emails.length === 0 ? (
              <p style={{ margin: '24px 0', textAlign: 'center', fontSize: '15px', color: '#9ca3af' }}>
                Keine Mails mit PDF-Anhängen gefunden.
              </p>
            ) : null}

            {emails.map((mail) => (
              <article
                key={mail.id}
                style={{
                  background: 'white',
                  border: '1px solid rgba(17,24,39,0.10)',
                  borderRadius: '16px',
                  padding: '14px 16px',
                  marginBottom: '10px',
                  boxShadow: '0 8px 22px rgba(17,24,39,0.05)',
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#111827',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {mail.from || 'Unbekannt'}
                </p>
                <p
                  style={{
                    margin: '2px 0 0',
                    fontSize: '13px',
                    color: '#6b7280',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {mail.subject || '(Ohne Betreff)'}
                </p>
                <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#9ca3af' }}>{mail.date || ''}</p>

                <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {(mail.attachments || []).map((att) => {
                    const key = attachKey(mail.id, att.attachmentId);
                    const state = processing[key];
                    const fname = att.filename || 'Anhang.pdf';

                    return (
                      <div key={key}>
                        {state?.status === 'loading' ? (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              fontSize: '13px',
                              color: '#6366f1',
                            }}
                          >
                            <span
                              style={{
                                width: '16px',
                                height: '16px',
                                borderRadius: '999px',
                                border: '2px solid #e5e7eb',
                                borderTopColor: '#6366f1',
                                animation: 'inboxSpin 0.8s linear infinite',
                                display: 'inline-block',
                              }}
                            />
                            Wird abgelegt…
                          </div>
                        ) : null}
                        {state?.status === 'success' ? (
                          <p style={{ margin: 0, fontSize: '13px', color: '#16a34a', fontWeight: 500 }}>
                            ✓ Abgelegt in {state.ordner}
                          </p>
                        ) : null}
                        {state?.status === 'error' ? (
                          <p style={{ margin: '0 0 4px', fontSize: '12px', color: '#dc2626' }}>{state.message}</p>
                        ) : null}

                        {!state || state.status === 'error' ? (
                          <button
                            type="button"
                            onClick={() => handleProcess(mail.id, att.attachmentId, fname)}
                            disabled={state?.status === 'loading'}
                            style={{
                              width: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '12px',
                              minHeight: '48px',
                              textAlign: 'left',
                              fontFamily: 'inherit',
                              fontSize: '14px',
                              fontWeight: 500,
                              color: '#374151',
                              border: '1px solid rgba(17,24,39,0.12)',
                              borderRadius: '12px',
                              padding: '10px 14px',
                              background: 'rgba(17,24,39,0.02)',
                              cursor: state?.status === 'loading' ? 'wait' : 'pointer',
                            }}
                          >
                            <span
                              style={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                                flex: 1,
                                minWidth: 0,
                              }}
                            >
                              {fname}
                            </span>
                            <span style={{ flexShrink: 0, fontSize: '13px', fontWeight: 600, color: '#6366f1' }}>
                              Ablegen
                            </span>
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </article>
            ))}
          </>
        ) : null}
      </div>

      <BottomNav />
    </main>
  );
}
