import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import BottomNav from '../components/BottomNav';
import api from '../services/api';

function IconHeaderDocuments({ size = 24, color = '#6366f1' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 4h4l2 2h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M8 12h8M8 16h5" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconEmptyState({ size = 48, color = '#e5e7eb' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 4h4l2 2h4a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z"
        stroke={color}
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M8 10h6M8 14h4" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function IconPdfCard() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ display: 'block' }}>
      <path
        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z"
        fill="#dc2626"
        fillOpacity="0.12"
        stroke="#dc2626"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M14 2v6h6" stroke="#dc2626" strokeWidth="1.4" strokeLinejoin="round" />
      <path d="M9.5 15.5h5M9.5 12h5" stroke="#dc2626" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function IconChevronRight({ size = 16, color = '#9ca3af' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 6l6 6-6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

/**
 * @param {{ modifiedTime?: string; createdTime?: string }} doc
 * @returns {string}
 */
function formatZuletztGeaendert(doc) {
  const iso = doc.modifiedTime || doc.createdTime;
  if (!iso) {
    return 'Zuletzt geändert: —';
  }
  try {
    const dateStr = new Date(iso).toLocaleDateString('de-DE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    return `Zuletzt geändert: ${dateStr}`;
  } catch {
    return 'Zuletzt geändert: —';
  }
}

function Documents() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('dokuhero_token');
    if (!token) {
      navigate('/');
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const response = await api.get('/api/documents', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!cancelled) {
          const list = response.data?.documents || [];
          setDocuments(
            [...list].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'de', { sensitivity: 'base' }))
          );
        }
      } catch {
        if (!cancelled) {
          setError('Dokumente konnten nicht geladen werden.');
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
  }, [navigate]);

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#f3f4f6',
        color: '#111827',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
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
            <IconHeaderDocuments />
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
              Meine Dokumente
            </h1>
          </div>
          <button
            type="button"
            className="logout-header-button"
            onClick={() => {
              localStorage.removeItem('dokuhero_token');
              localStorage.removeItem('dokuhero_refresh_token');
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

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '0 0 70px' }}>
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
                animation: 'documentsSpin 0.8s linear infinite',
                display: 'inline-block',
              }}
            />
            <style>{`
              @keyframes documentsSpin { to { transform: rotate(360deg); } }
            `}</style>
          </div>
        ) : null}

        {!loading && error ? (
          <p style={{ padding: '24px 16px', textAlign: 'center', color: '#dc2626', fontSize: '14px' }}>{error}</p>
        ) : null}

        {!loading && !error && documents.length === 0 ? (
          <div
            style={{
              padding: '48px 24px 24px',
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <IconEmptyState />
            </div>
            <p style={{ margin: 0, fontSize: '16px', color: '#9ca3af' }}>Noch keine Dokumente</p>
            <button
              type="button"
              onClick={() => navigate('/upload')}
              style={{
                marginTop: '20px',
                width: '100%',
                maxWidth: '280px',
                height: '48px',
                border: 'none',
                borderRadius: '10px',
                background: '#6366f1',
                color: '#fff',
                fontWeight: 600,
                fontSize: '15px',
                cursor: 'pointer',
                fontFamily: 'inherit',
              }}
            >
              Scanne dein erstes Dokument
            </button>
          </div>
        ) : null}

        {!loading && !error && documents.length > 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              padding: '16px',
            }}
          >
            {documents.map((doc) => (
              <button
                key={doc.id}
                type="button"
                onClick={() => {
                  if (doc.webViewLink) {
                    window.open(doc.webViewLink, '_blank', 'noopener,noreferrer');
                  }
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  cursor: doc.webViewLink ? 'pointer' : 'default',
                  textAlign: 'left',
                  fontFamily: 'inherit',
                  width: '100%',
                  boxSizing: 'border-box',
                }}
              >
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: '#fef2f2',
                    display: 'grid',
                    placeItems: 'center',
                    padding: '8px',
                    flexShrink: 0,
                    boxSizing: 'border-box',
                  }}
                >
                  <IconPdfCard />
                </div>
                <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                  <p
                    style={{
                      margin: 0,
                      fontSize: '14px',
                      fontWeight: 500,
                      color: '#111827',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {doc.name || 'Dokument'}
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: '12px', color: '#9ca3af' }}>{formatZuletztGeaendert(doc)}</p>
                </div>
                <IconChevronRight />
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <style>{`
        .logout-header-button:hover {
          background: #f3f4f6;
        }
      `}</style>
      <BottomNav />
    </main>
  );
}

export default Documents;
