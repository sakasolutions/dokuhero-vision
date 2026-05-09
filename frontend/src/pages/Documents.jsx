import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import BottomNav from '../components/BottomNav';
import api from '../services/api';
import { clearClientSession, ensureSessionOrRedirect } from '../utils/session';

const LS_STORAGE_PROVIDER = 'dokuhero_storage_provider';

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

function IconFolderLarge({ size = 48, color = '#e5e7eb' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 8a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z"
        stroke={color}
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconFolderCard({ size = 20, color = '#6366f1' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ display: 'block' }}>
      <path
        d="M4 8a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8Z"
        stroke={color}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconChevronRight({ size = 16, color = '#6366f1' }) {
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

function driveSearchLink(folderName) {
  const q = `DokuHero ${folderName}`;
  return `https://drive.google.com/drive/search?q=${encodeURIComponent(q)}`;
}

function driveSubfolderSearchLink(categoryName, subName) {
  const q = `DokuHero ${categoryName} ${subName}`;
  return `https://drive.google.com/drive/search?q=${encodeURIComponent(q)}`;
}

const HETZNER_DIRECT_SUBLABEL = '(ohne Anbieter)';

async function openAuthenticatedDocumentDownload(docId) {
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

function openFolderOrExternal(navigate, folder, subRow, storageProviderFromPage) {
  const storageProvider =
    storageProviderFromPage || localStorage.getItem(LS_STORAGE_PROVIDER) || 'google_drive';
  if (storageProvider === 'hetzner') {
    if (subRow?.name && subRow.name !== HETZNER_DIRECT_SUBLABEL) {
      navigate(`/documents/folder/${encodeURIComponent(folder.name)}/${encodeURIComponent(subRow.name)}`);
    } else {
      navigate(`/documents/folder/${encodeURIComponent(folder.name)}`);
    }
    return;
  }
  const url = subRow
    ? subRow.webViewLink || driveSubfolderSearchLink(folder.name, subRow.name)
    : folder.webViewLink || driveSearchLink(folder.name);
  window.open(url, '_blank', 'noopener,noreferrer');
}

function formatZuletztGeaendertKurz(iso) {
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

function formatZuletztHinzugefuegt(iso) {
  if (!iso) return '—';
  try {
    const d = new Date(iso);
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startDoc = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const diffDays = Math.round((startToday - startDoc) / 86400000);
    if (diffDays === 0) return 'Heute';
    if (diffDays === 1) return 'Gestern';
    return d.toLocaleDateString('de-DE', { day: 'numeric', month: 'short' });
  } catch {
    return '—';
  }
}

/** @deprecated Nur Fallback wenn API noch flache Dateien liefert */
function groupByCategory(files) {
  const byCat = new Map();
  for (const f of files) {
    if (f.mimeType === 'application/vnd.google-apps.folder') continue;
    const key = f.category || 'Allgemein';
    if (!byCat.has(key)) {
      byCat.set(key, { name: key, files: [], maxModified: null });
    }
    const g = byCat.get(key);
    g.files.push(f);
    const t = new Date(f.modifiedTime || f.createdTime || 0).getTime();
    const prev = g.maxModified ? new Date(g.maxModified).getTime() : -Infinity;
    if (t >= prev) {
      g.maxModified = f.modifiedTime || f.createdTime;
    }
  }
  return Array.from(byCat.values())
    .map(({ name, files: fl, maxModified }) => ({
      id: name,
      name,
      count: fl.length,
      modifiedTime: maxModified,
      webViewLink: undefined,
      type: 'folder',
      subFolders: [],
    }))
    .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'de', { sensitivity: 'base' }));
}

/**
 * API liefert Kategorie-Ordner: { id, name, modifiedTime, webViewLink, count, type: 'folder' }
 * @param {Array<Record<string, unknown>>} rows
 */
function normalizeFolderRows(rows) {
  const list = rows || [];
  if (list.length === 0) return [];
  const isFolderApi = list.every((r) => r.type === 'folder' && typeof r.count === 'number');
  if (isFolderApi) {
    return [...list]
      .map((r) => ({
        ...r,
        subFolders: Array.isArray(r.subFolders) ? r.subFolders : [],
      }))
      .sort((a, b) => (a.name || '').localeCompare(b.name || '', 'de', { sensitivity: 'base' }));
  }
  return groupByCategory(list);
}

function totalFileCountFromFolders(folders) {
  return folders.reduce((sum, f) => sum + (Number(f.count) || 0), 0);
}

function newestFolderModifiedIso(folders) {
  let best = -Infinity;
  let iso = null;
  const consider = (t) => {
    if (!t) return;
    const ts = new Date(t).getTime();
    if (!Number.isFinite(ts)) return;
    if (ts >= best) {
      best = ts;
      iso = t;
    }
  };
  for (const f of folders) {
    consider(f.modifiedTime);
    for (const s of f.subFolders || []) {
      consider(s.modifiedTime);
    }
  }
  return iso;
}

function StatCell({ value, label }) {
  return (
    <div style={{ textAlign: 'center', minWidth: 0 }}>
      <p style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>{value}</p>
      <p
        style={{
          margin: '6px 0 0',
          fontSize: '11px',
          color: '#9ca3af',
          textTransform: 'uppercase',
          letterSpacing: '0.02em',
          lineHeight: 1.3,
        }}
      >
        {label}
      </p>
    </div>
  );
}

function Documents() {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [storageProvider, setStorageProvider] = useState(() => localStorage.getItem(LS_STORAGE_PROVIDER));
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (value) => {
    setSearchQuery(value);
    if (!value || value.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const response = await api.get(`/api/documents/search?q=${encodeURIComponent(value.trim())}`);
      setSearchResults(response.data.documents || []);
    } catch {
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const folderGroups = useMemo(() => normalizeFolderRows(documents), [documents]);
  const folderGroupsVisible = useMemo(
    () =>
      folderGroups.filter(
        (folder) =>
          Number(folder.count) > 0 || (folder.subFolders || []).some((sub) => Number(sub.count) > 0)
      ),
    [folderGroups]
  );
  const totalFiles = useMemo(() => totalFileCountFromFolders(folderGroups), [folderGroups]);
  const newestIso = useMemo(() => newestFolderModifiedIso(folderGroupsVisible), [folderGroupsVisible]);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const ok = await ensureSessionOrRedirect(navigate);
      if (!ok || cancelled) return;

      setLoading(true);
      setError(null);
      try {
        try {
          const lsToken = localStorage.getItem('dokuhero_token');
          const { data } = await api.get('/api/user/me', {
            headers: lsToken ? { Authorization: `Bearer ${lsToken}` } : {},
          });
          if (!cancelled && data?.success && data.user) {
            const sp = data.user.storage_provider || null;
            if (sp) {
              localStorage.setItem(LS_STORAGE_PROVIDER, sp);
            } else {
              localStorage.removeItem(LS_STORAGE_PROVIDER);
            }
            setStorageProvider(sp);
          }
        } catch {
          if (!cancelled) {
            setStorageProvider(localStorage.getItem(LS_STORAGE_PROVIDER));
          }
        }

        const response = await api.get('/api/documents');
        if (!cancelled) {
          setDocuments(response.data?.documents || []);
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

  const showEmpty = !loading && !error && totalFiles === 0 && folderGroupsVisible.length === 0;
  const showContent = !loading && !error && (totalFiles > 0 || folderGroupsVisible.length > 0);

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
            onClick={async () => {
              localStorage.removeItem(LS_STORAGE_PROVIDER);
              localStorage.removeItem('gmail_token');
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
                border: '3px solid rgba(17,24,39,0.10)',
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

        {showEmpty ? (
          <div
            style={{
              padding: '48px 24px 24px',
              textAlign: 'center',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <IconFolderLarge />
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
                borderRadius: '12px',
                background:
                  'linear-gradient(135deg, rgba(99,102,241,1) 0%, rgba(79,70,229,1) 55%, rgba(67,56,202,1) 100%)',
                color: '#fff',
                fontWeight: 600,
                fontSize: '15px',
                cursor: 'pointer',
                fontFamily: 'inherit',
                boxShadow: '0 16px 36px rgba(99,102,241,0.22)',
              }}
            >
              Scanne dein erstes Dokument
            </button>
          </div>
        ) : null}

        {showContent ? (
          <>
            <section
              style={{
                background: '#fff',
                border: '1px solid rgba(17,24,39,0.10)',
                borderRadius: '18px',
                padding: '16px',
                margin: '16px',
                marginBottom: '8px',
                boxShadow: '0 10px 26px rgba(17,24,39,0.06)',
              }}
            >
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1fr',
                  gap: '8px',
                }}
              >
                <StatCell value={totalFiles} label="Dokumente gesamt" />
                <StatCell value={folderGroupsVisible.length} label="Kategorien" />
                <StatCell value={formatZuletztHinzugefuegt(newestIso)} label="Zuletzt hinzugefügt" />
              </div>
            </section>

            <div style={{ padding: '0 16px', marginBottom: '8px' }}>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'white',
                  border: '1px solid rgba(17,24,39,0.10)',
                  borderRadius: '14px',
                  padding: '10px 14px',
                  boxShadow: '0 8px 20px rgba(17,24,39,0.05)',
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <input
                  type="text"
                  placeholder="Dokumente durchsuchen..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  style={{
                    border: 'none',
                    outline: 'none',
                    width: '100%',
                    fontSize: '14px',
                    color: '#111827',
                    background: 'transparent',
                  }}
                />
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: '#9ca3af',
                      fontSize: '20px',
                      lineHeight: 1,
                    }}
                  >
                    ×
                  </button>
                ) : null}
              </div>
            </div>

            {searchQuery ? (
              <div style={{ padding: '0 16px' }}>
                {isSearching ? (
                  <p style={{ color: '#9ca3af', textAlign: 'center' }}>Suche...</p>
                ) : null}
                {!isSearching && searchResults.length === 0 ? (
                  <p style={{ color: '#9ca3af', textAlign: 'center' }}>
                    Keine Dokumente gefunden für &quot;{searchQuery}&quot;
                  </p>
                ) : null}
                {searchResults.map((doc) => (
                  <div
                    key={doc.id}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        void openAuthenticatedDocumentDownload(doc.id).catch((err) =>
                          window.alert(err?.message || 'Download fehlgeschlagen')
                        );
                      }
                    }}
                    onClick={() =>
                      void openAuthenticatedDocumentDownload(doc.id).catch((err) =>
                        window.alert(err?.message || 'Download fehlgeschlagen')
                      )
                    }
                    style={{
                      background: 'white',
                      border: '1px solid #e5e7eb',
                      borderRadius: '12px',
                      padding: '14px 16px',
                      marginBottom: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    <p style={{ margin: 0, fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                      {doc.filename?.replace(/\.pdf$/i, '')}
                    </p>
                    <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#9ca3af' }}>
                      {doc.category} {doc.sender ? `· ${doc.sender}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <p
                  style={{
                    margin: '16px 0 0',
                    padding: '0 16px',
                    fontSize: '13px',
                    fontWeight: 600,
                    color: '#9ca3af',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Ordner
                </p>

                <div style={{ padding: '0 16px' }}>
                  {folderGroupsVisible.map((folder) => {
                    const subsVisible = (folder.subFolders || []).filter((sub) => Number(sub.count) > 0);
                    const hasSubs = subsVisible.length > 0;
                    const folderKey = folder.id || folder.name;

                    if (hasSubs) {
                      return (
                        <div key={folderKey} style={{ marginBottom: '14px' }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '8px 0 6px',
                              marginBottom: '6px',
                            }}
                          >
                            <div
                              style={{
                                width: '32px',
                                height: '32px',
                                borderRadius: '8px',
                                background: '#eef2ff',
                                display: 'grid',
                                placeItems: 'center',
                                flexShrink: 0,
                              }}
                            >
                              <IconFolderCard size={18} />
                            </div>
                            <p style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#111827' }}>
                              {folder.name} ({folder.count})
                            </p>
                          </div>
                          <div style={{ marginLeft: '20px' }}>
                            {subsVisible.map((sub) => (
                              <button
                                key={sub.id || sub.name}
                                type="button"
                                onClick={() => openFolderOrExternal(navigate, folder, sub, storageProvider)}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '10px',
                                  width: '100%',
                                  margin: '0 0 6px',
                                  padding: '10px 12px',
                                  background: '#fff',
                                  border: '1px solid #e5e7eb',
                                  borderRadius: '10px',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  fontFamily: 'inherit',
                                  boxSizing: 'border-box',
                                }}
                              >
                                <div
                                  style={{
                                    width: '28px',
                                    height: '28px',
                                    borderRadius: '6px',
                                    background: '#f5f5ff',
                                    display: 'grid',
                                    placeItems: 'center',
                                    flexShrink: 0,
                                  }}
                                >
                                  <IconFolderCard size={16} />
                                </div>
                                <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                                  <p
                                    style={{
                                      margin: 0,
                                      fontSize: '14px',
                                      fontWeight: 600,
                                      color: '#111827',
                                      overflow: 'hidden',
                                      textOverflow: 'ellipsis',
                                      whiteSpace: 'nowrap',
                                      maxWidth: '160px',
                                    }}
                                  >
                                    {sub.name} ({sub.count})
                                  </p>
                                  <p style={{ margin: '2px 0 0', fontSize: '11px', color: '#9ca3af' }}>
                                    Zuletzt geändert: {formatZuletztGeaendertKurz(sub.modifiedTime)}
                                  </p>
                                </div>
                                <div
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '4px',
                                    flexShrink: 0,
                                  }}
                                >
                                  <span style={{ fontSize: '11px', color: '#6366f1', fontWeight: 600 }}>
                                    Öffnen →
                                  </span>
                                  <IconChevronRight size={14} color="#6366f1" />
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={folderKey}
                        type="button"
                        onClick={() => openFolderOrExternal(navigate, folder, null, storageProvider)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          margin: '0 0 8px',
                          padding: '14px 16px',
                          background: '#fff',
                          border: '1px solid #e5e7eb',
                          borderRadius: '12px',
                          cursor: 'pointer',
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
                            background: '#eef2ff',
                            display: 'grid',
                            placeItems: 'center',
                            padding: '8px',
                            flexShrink: 0,
                            boxSizing: 'border-box',
                          }}
                        >
                          <IconFolderCard />
                        </div>
                        <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                          <p
                            style={{
                              margin: 0,
                              fontSize: '15px',
                              fontWeight: 600,
                              color: '#111827',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {folder.name}
                          </p>
                          <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#9ca3af' }}>
                            {folder.count} Dokumente · Zuletzt geändert:{' '}
                            {formatZuletztGeaendertKurz(folder.modifiedTime)}
                          </p>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            flexShrink: 0,
                          }}
                        >
                          <span style={{ fontSize: '12px', color: '#6366f1', fontWeight: 500 }}>
                            Öffnen →
                          </span>
                          <IconChevronRight color="#6366f1" />
                        </div>
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </>
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
