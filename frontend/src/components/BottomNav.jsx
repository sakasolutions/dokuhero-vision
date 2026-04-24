import { useLocation, useNavigate } from 'react-router-dom';

function IconCloudNav({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M8 17h8a4 4 0 1 0-.64-7.95A5 5 0 0 0 6 10.5 3.5 3.5 0 0 0 8 17Z"
        stroke={color}
        strokeWidth="1.8"
      />
      <path
        d="M12 7v8m0-8-3 3m3-3 3 3"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconMailNav({ size = 22, color = 'currentColor' }) {
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

function IconSettingsNav({ size = 22, color = 'currentColor' }) {
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

function IconDocumentList({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M7 3h6l3 3v12a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"
        stroke={color}
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path d="M13.5 3.5V6a1 1 0 0 0 1 1h2" stroke={color} strokeWidth="1.5" />
      <path d="M4.5 8h.01M4.5 12h.01M4.5 16h.01" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M8 9h4M8 12h6M8 15h4" stroke={color} strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('dokuhero_token') : null;

  if (!token) {
    return null;
  }

  const isUpload = location.pathname === '/upload';
  const isDocuments = location.pathname === '/documents';
  const isInbox = location.pathname === '/inbox';
  const isSettings = location.pathname === '/settings';

  const tab = (path, label, active, icon) => (
    <button
      type="button"
      onClick={() => navigate(path)}
      style={{
        flex: 1,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        cursor: 'pointer',
        border: 'none',
        background: 'transparent',
        padding: 0,
        fontFamily: 'inherit',
        color: active ? '#6366f1' : '#9ca3af',
      }}
    >
      {icon}
      <span style={{ fontSize: '10px', fontWeight: 500, lineHeight: 1.15, textAlign: 'center' }}>{label}</span>
    </button>
  );

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: '60px',
        display: 'flex',
        background: '#fff',
        borderTop: '1px solid #e5e7eb',
      }}
    >
      {tab(
        '/upload',
        'Scannen',
        isUpload,
        <IconCloudNav color={isUpload ? '#6366f1' : '#9ca3af'} />
      )}
      {tab(
        '/documents',
        'Dokumente',
        isDocuments,
        <IconDocumentList color={isDocuments ? '#6366f1' : '#9ca3af'} />
      )}
      {tab(
        '/inbox',
        'Posteingang',
        isInbox,
        <IconMailNav color={isInbox ? '#6366f1' : '#9ca3af'} />
      )}
      {tab(
        '/settings',
        'Einstellungen',
        isSettings,
        <IconSettingsNav color={isSettings ? '#6366f1' : '#9ca3af'} />
      )}
    </nav>
  );
}

export default BottomNav;
