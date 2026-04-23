import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import api from '../services/api';

function IconFile() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 3h7l4 4v14H7z" stroke="#6366f1" strokeWidth="1.8" />
      <path d="M14 3v5h5" stroke="#6366f1" strokeWidth="1.8" />
    </svg>
  );
}

function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div
        style={{
          width: '30px',
          height: '30px',
          borderRadius: '8px',
          backgroundColor: '#6366f1',
          color: '#fff',
          display: 'grid',
          placeItems: 'center',
          fontWeight: 700,
          fontSize: '20px',
          lineHeight: 1,
        }}
      >
        D
      </div>
      <span style={{ color: '#fff', fontSize: '20px', fontWeight: 600 }}>DokuHero</span>
    </div>
  );
}

function Documents() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('dokuhero_token');
    if (!token) {
      navigate('/');
      return;
    }

    const loadDocuments = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/documents', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setDocuments(response.data?.documents || []);
      } catch (_error) {
        setError('Dokumente konnten nicht geladen werden.');
      } finally {
        setLoading(false);
      }
    };

    loadDocuments();
  }, [navigate]);

  return (
    <main
      style={{
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        color: '#fff',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <header style={{ borderBottom: '1px solid #262626' }}>
        <div
          style={{
            maxWidth: '480px',
            margin: '0 auto',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Logo />
          <Link to="/upload" style={{ color: '#6366f1', textDecoration: 'none', fontSize: '14px' }}>
            Zurück
          </Link>
        </div>
      </header>

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '24px 16px' }}>
        <h1 style={{ margin: '0 0 6px', fontSize: '24px', fontWeight: 600 }}>Letzte Dokumente</h1>
        <p style={{ margin: '0 0 16px', color: '#888', fontSize: '14px' }}>Aus deinem Google Drive</p>

        {loading ? <p style={{ color: '#888' }}>Lade Dokumente...</p> : null}
        {error ? <p style={{ color: '#ef4444' }}>{error}</p> : null}
        {!loading && !error && documents.length === 0 ? (
          <p style={{ textAlign: 'center', color: '#888', marginTop: '40px' }}>Noch keine Dokumente.</p>
        ) : null}

        {!loading && !error && documents.length > 0 ? (
          <div style={{ border: '1px solid #262626', borderRadius: '12px', overflow: 'hidden', backgroundColor: '#141414' }}>
            {documents.map((doc, index) => (
              <article
                key={doc.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '20px 1fr auto',
                  gap: '12px',
                  alignItems: 'center',
                  padding: '12px',
                  borderBottom: index < documents.length - 1 ? '1px solid #262626' : 'none',
                }}
              >
                <IconFile />
                <div>
                  <p style={{ margin: 0, color: '#fff', fontSize: '14px' }}>{doc.name}</p>
                  <p style={{ margin: '4px 0 0', color: '#888', fontSize: '13px' }}>{`DokuHero/${doc.name}`}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ margin: 0, color: '#555', fontSize: '13px' }}>
                    {doc.createdTime ? new Date(doc.createdTime).toLocaleDateString('de-DE') : 'Kein Datum'}
                  </p>
                  {doc.webViewLink ? (
                    <a href={doc.webViewLink} target="_blank" rel="noreferrer" style={{ color: '#6366f1', textDecoration: 'none', fontSize: '13px' }}>
                      Öffnen
                    </a>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </main>
  );
}

export default Documents;
