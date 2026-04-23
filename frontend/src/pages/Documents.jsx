import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import api from '../services/api';

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
    <main style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '16px' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        <h1 style={{ marginTop: 0, marginBottom: '8px' }}>Dokumente</h1>
        <p style={{ marginTop: 0, color: '#666' }}>Deine Dateien aus Google Drive</p>

        <Link to="/upload" style={{ display: 'inline-block', marginBottom: '16px', color: '#4285F4', textDecoration: 'none' }}>
          ← Zurück zum Upload
        </Link>

        {loading ? <p>Lade Dokumente...</p> : null}
        {error ? <p style={{ color: '#d93025' }}>{error}</p> : null}
        {!loading && !error && documents.length === 0 ? (
          <p>Noch keine Dokumente. Lade dein erstes hoch!</p>
        ) : null}

        {!loading && !error && documents.length > 0 ? (
          <div style={{ display: 'grid', gap: '10px' }}>
            {documents.map((doc) => (
              <article key={doc.id} style={{ backgroundColor: '#fff', borderRadius: '10px', padding: '12px' }}>
                <p style={{ margin: '0 0 6px', fontWeight: 600 }}>{doc.name}</p>
                <p style={{ margin: '0 0 6px', color: '#666', fontSize: '14px' }}>
                  {doc.createdTime ? new Date(doc.createdTime).toLocaleDateString('de-DE') : 'Kein Datum'}
                </p>
                {doc.webViewLink ? (
                  <a href={doc.webViewLink} target="_blank" rel="noreferrer" style={{ color: '#4285F4', textDecoration: 'none' }}>
                    In Google Drive öffnen →
                  </a>
                ) : null}
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </main>
  );
}

export default Documents;
