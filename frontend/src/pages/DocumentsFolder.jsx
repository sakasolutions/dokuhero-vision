import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';

import BottomNav from '../components/BottomNav';
import api from '../services/api';

function IconChevronLeft({ size = 20, color = '#6366f1' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 6l-6 6 6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * GET /api/documents/:id/download setzt 302 — mit Bearer nur per fetch + Location auslesen,
 * sonst schickt ein neues Fenster keinen Authorization-Header.
 */
async function openAuthenticatedDownload(docId) {
  const token = localStorage.getItem('dokuhero_token');
  const path = `/api/documents/${encodeURIComponent(docId)}/download`;
  const res = await fetch(path, {
    method: 'GET',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    redirect: 'manual',
  });

  if (res.status === 302 || res.status === 301 || res.status === 303 || res.status === 307 || res.status === 308) {
    let loc = res.headers.get('Location');
    if (loc && loc.startsWith('/')) {
      loc = `${window.location.origin}${loc}`;
    }
    if (loc) {
      window.open(loc, '_blank', 'noopener,noreferrer');
      return;
    }
  }

  if (!res.ok) {
    let msg = `Download fehlgeschlagen (${res.status})`;
    try {
      const j = await res.json();
      if (j?.error) msg = j.error;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
}

export default function DocumentsFolder() {
  const navigate = useNavigate();
  const { folderName: folderNameParam } = useParams();
  const [searchParams] = useSearchParams();
  const subFilter = searchParams.get('sub') || '';

  const folderName = folderNameParam ? decodeURIComponent(folderNameParam) : '';

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    if (!folderName) return;
    const token = localStorage.getItem('dokuhero_token');
    if (!token) {
      navigate('/');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const q = subFilter ? `?sub=${encodeURIComponent(subFilter)}` : '';
      const { data } = await api.get(`/api/documents/folder/${encodeURIComponent(folderName)}${q}`);
      setDocuments(data?.documents || []);
    } catch (e) {
      setError(e?.response?.data?.error || 'Ordner konnte nicht geladen werden.');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [folderName, subFilter, navigate]);

  useEffect(() => {
    void load();
  }, [load]);

  const title = subFilter ? `${folderName} · ${subFilter}` : folderName;

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
            gap: '12px',
          }}
        >
          <button
            type="button"
            onClick={() => navigate('/documents')}
            aria-label="Zurück"
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
            <IconChevronLeft />
          </button>
          <h1
            style={{
              margin: 0,
              fontSize: '17px',
              fontWeight: 600,
              color: '#111827',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
              minWidth: 0,
            }}
          >
            {title || 'Ordner'}
          </h1>
        </div>
      </header>

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '16px 16px 80px' }}>
        {loading ? (
          <p style={{ margin: 0, fontSize: '14px', color: '#9ca3af', textAlign: 'center' }}>Lade Dokumente…</p>
        ) : null}

        {!loading && error ? (
          <p style={{ margin: 0, fontSize: '14px', color: '#dc2626', textAlign: 'center' }}>{error}</p>
        ) : null}

        {!loading && !error && documents.length === 0 ? (
          <p style={{ margin: '24px 0', fontSize: '15px', color: '#9ca3af', textAlign: 'center' }}>
            Keine Dokumente in diesem Ordner.
          </p>
        ) : null}

        {!loading && !error && documents.length > 0
          ? documents.map((doc) => (
              <div
                key={doc.id}
                style={{
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: '12px',
                  padding: '14px 16px',
                  marginBottom: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
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
                    {doc.filename || doc.original_filename || 'Dokument'}
                  </p>
                  <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#9ca3af' }}>
                    {doc.document_type || doc.mime_type || ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await openAuthenticatedDownload(doc.id);
                    } catch (e) {
                      window.alert(e?.message || 'Download fehlgeschlagen');
                    }
                  }}
                  style={{
                    fontFamily: 'inherit',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#6366f1',
                    border: '1px solid #6366f1',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    background: '#fff',
                    cursor: 'pointer',
                    flexShrink: 0,
                  }}
                >
                  Öffnen →
                </button>
              </div>
            ))
          : null}
      </div>

      <BottomNav />
    </main>
  );
}
