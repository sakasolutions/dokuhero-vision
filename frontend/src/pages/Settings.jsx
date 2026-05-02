import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import BottomNav from '../components/BottomNav';
import api from '../services/api';

const LS_STORAGE_PROVIDER = 'dokuhero_storage_provider';

const LS_GMAIL = 'gmail_token';
const LS_GMAIL_REFRESH = 'gmail_refresh_token';

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

function IconSettingsHeader({ size = 24, color = '#6366f1' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        stroke={color}
        strokeWidth="1.7"
      />
      <path
        d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
        stroke={color}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconGoogleDrive() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#0066DA" d="M7.71 15.29 2 5.42h6.84l5.71 9.87z" />
      <path fill="#00AC47" d="m17.16 5.42-5.16 8.94h10.32L17.16 5.42z" />
      <path fill="#EA4335" d="M12 20.58 17.71 10.71H6.29L12 20.58z" />
      <path fill="#2684FC" d="M6.29 10.71 12 20.58 2 5.42h4.29z" />
      <path fill="#FFBA00" d="M17.71 10.71 12 20.58l10-15.16h-4.29z" />
    </svg>
  );
}

function IconGmailCard({ size = 26, color = '#6366f1' }) {
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

function IconOutlook({ size = 26 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="5" width="18" height="14" rx="2" stroke="#0078D4" strokeWidth="1.6" />
      <path d="M3 8l9 5 9-5" stroke="#0078D4" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function IconImapMail({ size = 26, color = '#6366f1' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7h16v10H4V7Z"
        stroke={color}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M4 9l8 5 8-5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function IconServer({ size = 26, color = '#6366f1' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="5" width="16" height="5" rx="1.5" stroke={color} strokeWidth="1.6" />
      <rect x="4" y="14" width="16" height="5" rx="1.5" stroke={color} strokeWidth="1.6" />
      <circle cx="8" cy="7.5" r="0.8" fill={color} />
      <circle cx="8" cy="16.5" r="0.8" fill={color} />
    </svg>
  );
}

function badgeSoon() {
  return (
    <span
      style={{
        fontSize: '11px',
        fontWeight: 600,
        color: '#9ca3af',
        background: '#f3f4f6',
        padding: '4px 8px',
        borderRadius: '6px',
      }}
    >
      Bald verfügbar
    </span>
  );
}

function sectionTitle(text) {
  return (
    <p
      style={{
        margin: '0 0 10px',
        fontSize: '12px',
        fontWeight: 700,
        letterSpacing: '0.06em',
        color: '#9ca3af',
      }}
    >
      {text}
    </p>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const [gmailConnected, setGmailConnected] = useState(false);
  const [driveConnected, setDriveConnected] = useState(false);
  const [storageProvider, setStorageProvider] = useState(null);
  const [meLoading, setMeLoading] = useState(true);
  const [activatingProvider, setActivatingProvider] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('dokuhero_token');
    if (!token) {
      navigate('/');
    }
  }, [navigate]);

  useEffect(() => {
    setGmailConnected(!!localStorage.getItem(LS_GMAIL));
  }, []);

  async function fetchUserMe() {
    const token = localStorage.getItem('dokuhero_token');
    if (!token) return;
    setMeLoading(true);
    try {
      const { data } = await api.get('/api/user/me');
      if (data?.success && data.user) {
        const sp = data.user.storage_provider || null;
        setStorageProvider(sp);
        const linked = !!(data.user.drive_access_token || data.user.drive_refresh_token);
        setDriveConnected(linked);
        if (linked) {
          localStorage.setItem('dokuhero_drive_connected', 'true');
        }
        if (sp) {
          localStorage.setItem(LS_STORAGE_PROVIDER, sp);
        } else {
          localStorage.removeItem(LS_STORAGE_PROVIDER);
        }
      }
    } catch {
      setToast({ type: 'error', text: 'Profil konnte nicht geladen werden.' });
    } finally {
      setMeLoading(false);
    }
  }

  useEffect(() => {
    fetchUserMe();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gToken = params.get('gmail_token');
    const gRefresh = params.get('gmail_refresh');
    const gmailErr = params.get('gmail');
    const driveStatus = params.get('drive');
    const driveToken = params.get('drive_token');

    if (gToken) {
      localStorage.setItem(LS_GMAIL, gToken);
      if (gRefresh) {
        localStorage.setItem(LS_GMAIL_REFRESH, gRefresh);
      }
      setGmailConnected(true);
      setToast({ type: 'success', text: 'Gmail erfolgreich verbunden!' });
      window.history.replaceState({}, '', `${window.location.pathname}`);
    } else if (gmailErr === 'error') {
      setToast({ type: 'error', text: 'Gmail konnte nicht verbunden werden.' });
      window.history.replaceState({}, '', `${window.location.pathname}`);
    }

    if (driveStatus === 'connected') {
      localStorage.setItem('dokuhero_drive_connected', 'true');
      if (driveToken) {
        localStorage.setItem('dokuhero_drive_token', driveToken);
      }
      setToast({ type: 'success', text: 'Google Drive erfolgreich verbunden!' });
      window.history.replaceState({}, '', `${window.location.pathname}`);
      fetchUserMe();
    } else if (driveStatus === 'error') {
      setToast({ type: 'error', text: 'Google Drive konnte nicht verbunden werden.' });
      window.history.replaceState({}, '', `${window.location.pathname}`);
    }
  }, []);

  useEffect(() => {
    if (!toast) return undefined;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  const disconnectGmail = () => {
    localStorage.removeItem(LS_GMAIL);
    localStorage.removeItem(LS_GMAIL_REFRESH);
    setGmailConnected(false);
  };

  async function activateStorageProvider(provider) {
    setActivatingProvider(provider);
    try {
      await api.post('/api/user/storage-provider', { provider });
      setStorageProvider(provider);
      localStorage.setItem(LS_STORAGE_PROVIDER, provider);
      setToast({ type: 'success', text: 'Speicher wurde gewechselt.' });
    } catch (err) {
      const msg = err?.response?.data?.error || err?.message || 'Speicher konnte nicht gewechselt werden.';
      setToast({ type: 'error', text: msg });
    } finally {
      setActivatingProvider(null);
    }
  }

  function openDriveOAuth() {
    const userId = localStorage.getItem('dokuhero_user_id');
    if (!userId) {
      setToast({ type: 'error', text: 'User-ID fehlt. Bitte neu einloggen.' });
      return;
    }
    window.location.href = `/api/auth/drive?user_id=${encodeURIComponent(userId)}`;
  }

  const cardBase = {
    background: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '16px',
    marginBottom: '10px',
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#f3f4f6',
        color: '#111827',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      {toast ? (
        <div
          role="status"
          style={{
            position: 'fixed',
            top: '16px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 200,
            maxWidth: 'min(420px, calc(100vw - 32px))',
            padding: '12px 16px',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 500,
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            background: toast.type === 'success' ? '#ecfdf5' : '#fef2f2',
            color: toast.type === 'success' ? '#047857' : '#b91c1c',
            border: `1px solid ${toast.type === 'success' ? '#a7f3d0' : '#fecaca'}`,
          }}
        >
          {toast.text}
        </div>
      ) : null}

      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
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
            <IconSettingsHeader />
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
              Einstellungen
            </h1>
          </div>
          <button
            type="button"
            onClick={() => {
              localStorage.removeItem('dokuhero_token');
              localStorage.removeItem('dokuhero_refresh_token');
              localStorage.removeItem('dokuhero_user_id');
              localStorage.removeItem('dokuhero_drive_connected');
              localStorage.removeItem('dokuhero_drive_token');
              localStorage.removeItem(LS_STORAGE_PROVIDER);
              localStorage.removeItem(LS_GMAIL);
              localStorage.removeItem(LS_GMAIL_REFRESH);
              window.location.href = '/';
            }}
            aria-label="Abmelden"
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
              background: 'transparent',
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
        {sectionTitle('VERBUNDENE KONTEN')}

        <div style={cardBase}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
            <IconGmailCard />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#111827' }}>Gmail</p>
              {gmailConnected ? (
                <div style={{ marginTop: '10px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center' }}>
                  <span style={{ fontSize: '13px', color: '#16a34a', fontWeight: 600 }}>Verbunden ✓</span>
                  <button
                    type="button"
                    onClick={disconnectGmail}
                    style={{
                      fontFamily: 'inherit',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: '#374151',
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      background: '#fff',
                      cursor: 'pointer',
                    }}
                  >
                    Trennen
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    window.location.href = '/api/auth/gmail';
                  }}
                  style={{
                    marginTop: '12px',
                    fontFamily: 'inherit',
                    fontSize: '14px',
                    fontWeight: 600,
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '8px 16px',
                    background: '#6366f1',
                    cursor: 'pointer',
                  }}
                >
                  Verbinden
                </button>
              )}
            </div>
          </div>
        </div>

        <div style={cardBase}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
              <IconOutlook />
              <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#111827' }}>Outlook</p>
            </div>
            {badgeSoon()}
          </div>
        </div>

        <div style={cardBase}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
              <IconImapMail />
              <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#111827' }}>Anderes E-Mail Konto</p>
            </div>
            {badgeSoon()}
          </div>
        </div>

        <div style={{ height: '8px' }} />

        {sectionTitle('SPEICHER')}

        <p style={{ margin: '0 0 12px', fontSize: '13px', color: '#6b7280', lineHeight: 1.45 }}>
          Es ist immer genau ein Speicher aktiv. Du kannst jederzeit wechseln.
        </p>

        {meLoading ? (
          <p style={{ margin: 0, fontSize: '14px', color: '#9ca3af' }}>Lade Einstellungen…</p>
        ) : (
          <>
            {/* Hetzner Tresor */}
            <div
              style={{
                ...cardBase,
                border:
                  storageProvider === 'hetzner' ? '2px solid #6366f1' : '1px solid #e5e7eb',
                marginBottom: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <IconServer />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#111827' }}>Hetzner Tresor</p>
                    {storageProvider === 'hetzner' ? (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#15803d',
                          background: '#dcfce7',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          flexShrink: 0,
                        }}
                      >
                        Aktiv ✓
                      </span>
                    ) : null}
                  </div>
                  <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#9ca3af' }}>
                    EU-Hosting über Object Storage — kein Google-Konto nötig.
                  </p>
                  {storageProvider !== 'hetzner' ? (
                    <button
                      type="button"
                      disabled={activatingProvider === 'hetzner'}
                      onClick={() => activateStorageProvider('hetzner')}
                      style={{
                        marginTop: '12px',
                        fontFamily: 'inherit',
                        fontSize: '14px',
                        fontWeight: 600,
                        color: '#fff',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '8px 16px',
                        background: activatingProvider === 'hetzner' ? '#a5b4fc' : '#6366f1',
                        cursor: activatingProvider === 'hetzner' ? 'default' : 'pointer',
                      }}
                    >
                      {activatingProvider === 'hetzner' ? 'Wird aktiviert…' : 'Aktivieren'}
                    </button>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Google Drive */}
            <div
              style={{
                ...cardBase,
                border:
                  storageProvider === 'google_drive' ? '2px solid #6366f1' : '1px solid #e5e7eb',
                marginBottom: '10px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <IconGoogleDrive />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#111827' }}>Google Drive</p>
                    {storageProvider === 'google_drive' ? (
                      <span
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: '#15803d',
                          background: '#dcfce7',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          flexShrink: 0,
                        }}
                      >
                        Aktiv ✓
                      </span>
                    ) : null}
                  </div>
                  <p style={{ margin: '8px 0 0', fontSize: '12px', color: '#9ca3af' }}>
                    Dokumente in deinem Google Drive unter „DokuHero“.
                  </p>
                  {storageProvider !== 'google_drive' ? (
                    driveConnected ? (
                      <button
                        type="button"
                        disabled={activatingProvider === 'google_drive'}
                        onClick={() => activateStorageProvider('google_drive')}
                        style={{
                          marginTop: '12px',
                          fontFamily: 'inherit',
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '8px 16px',
                          background: activatingProvider === 'google_drive' ? '#a5b4fc' : '#6366f1',
                          cursor: activatingProvider === 'google_drive' ? 'default' : 'pointer',
                        }}
                      >
                        {activatingProvider === 'google_drive' ? 'Wird aktiviert…' : 'Aktivieren'}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={openDriveOAuth}
                        style={{
                          marginTop: '12px',
                          fontFamily: 'inherit',
                          fontSize: '14px',
                          fontWeight: 600,
                          color: '#6366f1',
                          border: '1px solid #6366f1',
                          borderRadius: '8px',
                          padding: '8px 16px',
                          background: '#fff',
                          cursor: 'pointer',
                        }}
                      >
                        Verbinden
                      </button>
                    )
                  ) : null}
                </div>
              </div>
            </div>

            <div style={{ ...cardBase, marginBottom: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>OneDrive</span>
                {badgeSoon()}
              </div>
            </div>
          </>
        )}
      </div>

      <BottomNav />
    </main>
  );
}
