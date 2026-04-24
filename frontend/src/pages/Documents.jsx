import { useEffect, useMemo, useState } from 'react';
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

  const folderGroups = useMemo(() => normalizeFolderRows(documents), [documents]);
  const folderGroupsVisible = useMemo(
    () =>
      folderGroups.filter(
        (folder) => Number(folder.count) > 0 || (Array.isArray(folder.subFolders) && folder.subFolders.length > 0)
      ),
    [folderGroups]
  );
  const totalFiles = useMemo(() => totalFileCountFromFolders(folderGroups), [folderGroups]);
  const newestIso = useMemo(() => newestFolderModifiedIso(folderGroupsVisible), [folderGroupsVisible]);

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

        {showContent ? (
          <>
            <section
              style={{
                background: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '16px',
                margin: '16px',
                marginBottom: '8px',
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
                const hasSubs = Array.isArray(folder.subFolders) && folder.subFolders.length > 0;
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
                        {folder.subFolders.map((sub) => (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() =>
                              window.open(
                                sub.webViewLink || driveSubfolderSearchLink(folder.name, sub.name),
                                '_blank',
                                'noopener,noreferrer'
                              )
                            }
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
                                In Drive öffnen
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
                    onClick={() =>
                      window.open(folder.webViewLink || driveSearchLink(folder.name), '_blank', 'noopener,noreferrer')
                    }
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
                        {folder.count} Dokumente · Zuletzt geändert: {formatZuletztGeaendertKurz(folder.modifiedTime)}
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
                      <span style={{ fontSize: '12px', color: '#6366f1', fontWeight: 500 }}>In Drive öffnen</span>
                      <IconChevronRight color="#6366f1" />
                    </div>
                  </button>
                );
              })}
            </div>
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
