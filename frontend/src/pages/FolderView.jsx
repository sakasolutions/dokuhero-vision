import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import BottomNav from '../components/BottomNav';
import api from '../services/api';
import { ensureSessionOrRedirect } from '../utils/session';

function IconChevronLeft({ size = 20, color = '#6366f1' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M15 6l-6 6 6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function filenameWithoutPdf(filename) {
  return String(filename || '').replace(/\.pdf$/i, '').trim() || 'Dokument';
}

function formatDocDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('de-DE', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return '—';
  }
}

/** Drive: 302 + Location; Hetzner: 200 + Stream — Authorization nur per fetch möglich. */
async function openDownload(docId) {
  const token = localStorage.getItem('dokuhero_token');
  const path = `/api/documents/${encodeURIComponent(docId)}/download`;
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(path, {
    method: 'GET',
    headers,
    credentials: 'include',
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

  if (res.ok) {
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, '_blank', 'noopener,noreferrer');
    window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    return;
  }

  let msg = `Download fehlgeschlagen (${res.status})`;
  try {
    const j = await res.json();
    if (j?.error) msg = j.error;
  } catch {
    /* ignore */
  }
  throw new Error(msg);
}

export default function FolderView() {
  const navigate = useNavigate();
  const { category, subcategory } = useParams();

  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const load = useCallback(async () => {
    const ok = await ensureSessionOrRedirect(navigate);
    if (!ok) {
      return;
    }

    if (!category) {
      setError('Ungültiger Ordner');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const catEnc = encodeURIComponent(category);
      const path = subcategory
        ? `/api/documents/folder/${catEnc}/${encodeURIComponent(subcategory)}`
        : `/api/documents/folder/${catEnc}`;
      const { data } = await api.get(path);
      setDocuments(data?.documents || []);
    } catch (e) {
      setError(e?.response?.data?.error || 'Ordner konnte nicht geladen werden.');
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  }, [category, subcategory, navigate]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      void load();
    }, 0);
    return () => window.clearTimeout(t);
  }, [load]);

  const title = subcategory ? `${category} · ${subcategory}` : category;

  const handleDelete = async (docId) => {
    if (!window.confirm('Dokument wirklich löschen?')) {
      return;
    }
    setDeletingId(docId);
    try {
      await api.delete(`/api/documents/${encodeURIComponent(docId)}`);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
    } catch (e) {
      window.alert(e?.response?.data?.error || 'Löschen fehlgeschlagen.');
    } finally {
      setDeletingId(null);
    }
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
            {title}
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

        {!loading &&
          !error &&
          documents.map((doc) => (
            <div
              key={doc.id}
              style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '14px 16px',
                marginBottom: '8px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
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
                    {filenameWithoutPdf(doc.filename || doc.original_filename)}
                  </p>
                  <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#9ca3af' }}>
                    {formatDocDate(doc.created_at)}
                  </p>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px', flexShrink: 0 }}>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await openDownload(doc.id);
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
                    }}
                  >
                    Öffnen →
                  </button>
                  <button
                    type="button"
                    disabled={deletingId === doc.id}
                    onClick={() => handleDelete(doc.id)}
                    style={{
                      fontFamily: 'inherit',
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#dc2626',
                      border: 'none',
                      background: 'transparent',
                      padding: '2px 0',
                      cursor: deletingId === doc.id ? 'wait' : 'pointer',
                    }}
                  >
                    {deletingId === doc.id ? 'Löschen…' : 'Löschen'}
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>

      <BottomNav />
    </main>
  );
}
