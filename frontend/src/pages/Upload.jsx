import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import api from '../services/api';

function Upload() {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const loadingTexts = useMemo(
    () => ['📷 Text wird erkannt...', '🤖 KI analysiert...', '📁 Wird abgelegt...'],
    []
  );
  const [loadingTextIndex, setLoadingTextIndex] = useState(0);

  const handleLogout = () => {
    localStorage.removeItem('dokuhero_token');
    navigate('/');
  };

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) {
      return;
    }

    setFile(selectedFile);
    setResult(null);
    setStatus('idle');

    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result || '');
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview('');
    }
  };

  const handleUpload = async () => {
    if (!file || !token) {
      return;
    }

    setStatus('uploading');
    setResult(null);

    const uploadDocument = async (accessToken) => {
      const formData = new FormData();
      formData.append('document', file);

      return api.post('/api/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${accessToken}`,
        },
      });
    };

    const refreshAccessToken = async () => {
      const storedRefreshToken = localStorage.getItem('dokuhero_refresh_token');
      if (!storedRefreshToken) {
        navigate('/');
        throw new Error('No refresh token available');
      }

      const response = await api.post('/api/auth/refresh', {
        refresh_token: storedRefreshToken,
      });

      const newToken = response?.data?.access_token;
      if (!newToken) {
        navigate('/');
        throw new Error('Refresh failed');
      }

      localStorage.setItem('dokuhero_token', newToken);
      setToken(newToken);
      return newToken;
    };

    try {
      const response = await uploadDocument(token);
      setResult(response.data);
      setStatus('success');
    } catch (error) {
      const statusCode = error?.response?.status;
      const hasNoResponse = !error?.response;
      const shouldTryRefresh = statusCode === 401 || hasNoResponse;

      if (!shouldTryRefresh) {
        setStatus('error');
        return;
      }

      try {
        const refreshedToken = await refreshAccessToken();
        const retryResponse = await uploadDocument(refreshedToken);
        setResult(retryResponse.data);
        setStatus('success');
      } catch (_refreshError) {
        setStatus('error');
        navigate('/');
      }
    }
  };

  const resetUpload = () => {
    setFile(null);
    setPreview('');
    setResult(null);
    setStatus('idle');
    setLoadingTextIndex(0);
  };

  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    const tokenFromUrl = currentUrl.searchParams.get('access_token');
    const refreshTokenFromUrl = currentUrl.searchParams.get('refresh_token');

    if (tokenFromUrl) {
      localStorage.setItem('dokuhero_token', tokenFromUrl);
      setToken(tokenFromUrl);
      if (refreshTokenFromUrl) {
        localStorage.setItem('dokuhero_refresh_token', refreshTokenFromUrl);
      }
      currentUrl.searchParams.delete('access_token');
      currentUrl.searchParams.delete('refresh_token');
      window.history.replaceState({}, document.title, currentUrl.toString());
      return;
    }

    const existingToken = localStorage.getItem('dokuhero_token');
    if (!existingToken) {
      navigate('/');
      return;
    }

    setToken(existingToken);
  }, [navigate]);

  useEffect(() => {
    if (status !== 'uploading') {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setLoadingTextIndex((prev) => (prev + 1) % loadingTexts.length);
    }, 2000);

    return () => window.clearInterval(timer);
  }, [status, loadingTexts.length]);

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#f8f9fa', padding: '16px' }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
          <h1 style={{ margin: 0, fontSize: '24px', color: '#1a1a1a' }}>📄 DokuHero</h1>
          <button
            type="button"
            onClick={handleLogout}
            style={{
              border: '1px solid #ddd',
              borderRadius: '8px',
              height: '36px',
              padding: '0 12px',
              backgroundColor: '#fff',
              cursor: 'pointer',
            }}
          >
            Abmelden
          </button>
        </header>

        {(status === 'idle' || status === 'error') && (
          <>
            <section
              style={{
                border: '2px dashed #ddd',
                borderRadius: '12px',
                padding: '40px 16px',
                backgroundColor: '#fff',
                textAlign: 'center',
              }}
            >
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>📷</div>
              <p style={{ margin: '0 0 20px', fontSize: '16px', color: '#444' }}>Dokument fotografieren oder hochladen</p>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                <label
                  style={{
                    flex: 1,
                    maxWidth: '180px',
                    backgroundColor: '#fff',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  📷 Kamera
                  <input
                    type="file"
                    accept="image/*"
                    capture="environment"
                    style={{ display: 'none' }}
                    onChange={(event) => handleFileSelect(event.target.files?.[0])}
                  />
                </label>

                <label
                  style={{
                    flex: 1,
                    maxWidth: '180px',
                    backgroundColor: '#fff',
                    border: '1px solid #ccc',
                    borderRadius: '8px',
                    height: '44px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                  }}
                >
                  📁 Datei
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    style={{ display: 'none' }}
                    onChange={(event) => handleFileSelect(event.target.files?.[0])}
                  />
                </label>
              </div>

              {file && (
                <div style={{ marginTop: '18px' }}>
                  <p style={{ margin: '0 0 8px', fontSize: '14px', color: '#555' }}>{file.name}</p>
                  {preview ? (
                    <img src={preview} alt="Vorschau" style={{ width: '100%', maxHeight: '200px', objectFit: 'contain' }} />
                  ) : null}
                </div>
              )}
            </section>

            {status === 'error' ? (
              <p style={{ color: '#d93025', fontSize: '14px', marginTop: '12px' }}>Upload fehlgeschlagen. Bitte erneut versuchen.</p>
            ) : null}

            {file && status !== 'uploading' && (
              <button
                type="button"
                onClick={handleUpload}
                style={{
                  marginTop: '16px',
                  width: '100%',
                  height: '52px',
                  border: 'none',
                  borderRadius: '8px',
                  backgroundColor: '#4285F4',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Dokument analysieren & ablegen
              </button>
            )}
          </>
        )}

        {status === 'uploading' && (
          <section style={{ borderRadius: '12px', backgroundColor: '#fff', padding: '40px 20px', textAlign: 'center' }}>
            <div
              style={{
                width: '46px',
                height: '46px',
                borderRadius: '50%',
                border: '4px solid #dbe6ff',
                borderTopColor: '#4285F4',
                margin: '0 auto 16px',
                animation: 'spin 1s linear infinite',
              }}
            />
            <p style={{ margin: 0, color: '#333', fontSize: '16px' }}>{loadingTexts[loadingTextIndex]}</p>
          </section>
        )}

        {status === 'success' && result && (
          <section style={{ textAlign: 'center', backgroundColor: '#fff', borderRadius: '12px', padding: '24px 16px' }}>
            <div style={{ fontSize: '64px', marginBottom: '8px' }}>✅</div>
            <h2 style={{ margin: '0 0 16px', fontSize: '24px', fontWeight: 700 }}>Erfolgreich abgelegt!</h2>

            <div style={{ backgroundColor: '#f1f3f4', borderRadius: '10px', padding: '14px', textAlign: 'left' }}>
              <p style={{ margin: '0 0 8px' }}>
                <strong>Ordner:</strong> {result.analysis?.ordner || '-'}
              </p>
              <p style={{ margin: '0 0 8px' }}>
                <strong>Datei:</strong> {result.storage?.path || '-'}
              </p>
              {result.storage?.webViewLink ? (
                <a href={result.storage.webViewLink} target="_blank" rel="noreferrer" style={{ color: '#4285F4', textDecoration: 'none' }}>
                  In Google Drive öffnen →
                </a>
              ) : (
                <p style={{ margin: 0, color: '#d93025' }}>{result.storage?.error || 'Kein Drive-Link verfügbar'}</p>
              )}
            </div>

            <button
              type="button"
              onClick={resetUpload}
              style={{
                marginTop: '16px',
                width: '100%',
                height: '48px',
                border: 'none',
                borderRadius: '8px',
                backgroundColor: '#4285F4',
                color: '#fff',
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Weiteres Dokument scannen
            </button>
          </section>
        )}
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}

export default Upload;
