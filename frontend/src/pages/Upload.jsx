import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import api from '../services/api';

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

function IconCloudUpload() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 17h8a4 4 0 1 0-.64-7.95A5 5 0 0 0 6 10.5 3.5 3.5 0 0 0 8 17Z" stroke="#6366f1" strokeWidth="1.8" />
      <path d="M12 7v8m0-8-3 3m3-3 3 3" stroke="#6366f1" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconCamera({ color = '#fff' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 8h16v10H4z" stroke={color} strokeWidth="1.8" />
      <path d="M9 8 10.2 6h3.6L15 8" stroke={color} strokeWidth="1.8" />
      <circle cx="12" cy="13" r="3" stroke={color} strokeWidth="1.8" />
    </svg>
  );
}

function IconFile({ color = '#fff' }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 3h7l4 4v14H7z" stroke={color} strokeWidth="1.8" />
      <path d="M14 3v5h5" stroke={color} strokeWidth="1.8" />
    </svg>
  );
}

function IconCheck({ color = '#22c55e', size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12.8 9.5 17 19 7.5" stroke={color} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function IconLogout() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M9 21H5V3h4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M13 7l5 5-5 5M18 12H9" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Spinner({ size = 16 }) {
  return <span className="spinner" style={{ width: `${size}px`, height: `${size}px` }} />;
}

function Upload() {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('Bitte versuche es erneut.');
  const [activeStep, setActiveStep] = useState(1);
  const steps = useMemo(
    () => [
      { title: 'Dokument empfangen', text: 'Datei wird übertragen...' },
      { title: 'KI analysiert', text: 'Typ und Absender werden erkannt...' },
      { title: 'Wird abgelegt', text: 'Datei landet in Google Drive...' },
    ],
    []
  );

  const handleLogout = () => {
    localStorage.removeItem('dokuhero_token');
    localStorage.removeItem('dokuhero_refresh_token');
    navigate('/');
  };

  const handleFileSelect = (selectedFile) => {
    if (!selectedFile) {
      return;
    }

    setFile(selectedFile);
    setResult(null);
    setStatus('idle');
    setErrorMessage('Bitte versuche es erneut.');

    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => setPreview(reader.result || '');
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview('');
    }
  };

  const handleUpload = async (forceUpload = false) => {
    if (!file || !token) {
      return;
    }

    setStatus('uploading');
    setResult(null);
    setErrorMessage('Bitte versuche es erneut.');
    setActiveStep(1);

    let step2Timer;

    const uploadDocument = async (accessToken) => {
      const formData = new FormData();
      formData.append('document', file);
      if (forceUpload) {
        formData.append('forceUpload', 'true');
      }

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

    step2Timer = window.setTimeout(() => {
      setActiveStep(2);
    }, 1000);

    try {
      const response = await uploadDocument(token);
      setActiveStep(3);
      await new Promise((resolve) => window.setTimeout(resolve, 420));
      setResult(response.data);
      setStatus(response.data?.storage?.duplicate ? 'duplicate' : 'success');
    } catch (error) {
      const statusCode = error?.response?.status;
      const hasNoResponse = !error?.response;
      const shouldTryRefresh = statusCode === 401 || hasNoResponse;

      if (!shouldTryRefresh) {
        setErrorMessage(error?.response?.data?.error || 'Upload fehlgeschlagen.');
        setStatus('error');
        return;
      }

      try {
        const refreshedToken = await refreshAccessToken();
        const retryResponse = await uploadDocument(refreshedToken);
        setActiveStep(3);
        await new Promise((resolve) => window.setTimeout(resolve, 420));
        setResult(retryResponse.data);
        setStatus(retryResponse.data?.storage?.duplicate ? 'duplicate' : 'success');
      } catch (refreshError) {
        setErrorMessage(refreshError?.response?.data?.error || 'Sitzung abgelaufen. Bitte neu anmelden.');
        setStatus('error');
        navigate('/');
      }
    } finally {
      if (step2Timer) {
        window.clearTimeout(step2Timer);
      }
    }
  };

  const resetUpload = (forceRetry = false) => {
    setFile(null);
    setPreview('');
    setResult(null);
    setStatus(forceRetry ? 'idle' : 'idle');
    setErrorMessage('Bitte versuche es erneut.');
    setActiveStep(1);
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
      setActiveStep(1);
    }
  }, [status]);

  return (
    <main style={{ minHeight: '100vh', backgroundColor: '#0a0a0a', color: '#fff', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backgroundColor: '#0a0a0a',
          borderBottom: '1px solid #262626',
        }}
      >
        <div style={{ maxWidth: '480px', margin: '0 auto', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Logo />
          <button
            type="button"
            onClick={handleLogout}
            aria-label="Abmelden"
            style={{
              width: '36px',
              height: '36px',
              border: '1px solid #262626',
              borderRadius: '8px',
              backgroundColor: '#141414',
              color: '#888',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
              transition: 'color 0.18s ease',
            }}
            className="logout-button"
          >
            <IconLogout />
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '24px 16px' }}>
        {(status === 'idle' || (status === 'error' && !result)) && (
          <>
            <section
              style={{
                border: '1px solid #262626',
                borderRadius: '12px',
                padding: '16px',
                backgroundColor: '#141414',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  border: '1.5px dashed #333',
                  borderRadius: '8px',
                  padding: '40px 16px',
                }}
              >
                <div style={{ marginBottom: '12px', display: 'grid', placeItems: 'center' }}>
                  <IconCloudUpload />
                </div>
                <p style={{ margin: '0 0 6px', fontSize: '17px', color: '#fff', fontWeight: 500 }}>Dokument hochladen</p>
                <p style={{ margin: '0 0 20px', fontSize: '14px', color: '#888' }}>JPG, PNG oder PDF</p>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                  <label className="btn-secondary" style={{ flex: 1 }}>
                    <IconCamera />
                    <span>Kamera</span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      style={{ display: 'none' }}
                      onChange={(event) => handleFileSelect(event.target.files?.[0])}
                    />
                  </label>

                  <label className="btn-secondary" style={{ flex: 1 }}>
                    <IconFile />
                    <span>Datei</span>
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      style={{ display: 'none' }}
                      onChange={(event) => handleFileSelect(event.target.files?.[0])}
                    />
                  </label>
                </div>
              </div>

              {file && (
                <div style={{ marginTop: '16px' }}>
                  {preview ? (
                    <img
                      src={preview}
                      alt="Vorschau"
                      style={{
                        width: '100%',
                        maxHeight: '180px',
                        objectFit: 'contain',
                        borderRadius: '8px',
                        border: '1px solid #262626',
                      }}
                    />
                  ) : null}
                  <p style={{ margin: '10px 0 0', fontSize: '13px', color: '#888' }}>{file.name}</p>
                </div>
              )}
            </section>

            {status === 'error' ? (
              <div style={{ marginTop: '16px', backgroundColor: '#141414', border: '1px solid #262626', borderRadius: '12px', padding: '20px', textAlign: 'center' }}>
                <div
                  style={{
                    width: '48px',
                    height: '48px',
                    margin: '0 auto 12px',
                    borderRadius: '999px',
                    border: '1px solid #ef4444',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M7 7l10 10M17 7 7 17" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
                  </svg>
                </div>
                <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 600 }}>Upload fehlgeschlagen</h2>
                <p style={{ margin: '0 0 14px', color: '#888', fontSize: '14px' }}>{errorMessage}</p>
                <button type="button" className="btn-primary" onClick={() => resetUpload(true)}>
                  Erneut versuchen
                </button>
              </div>
            ) : null}

            {file && status !== 'uploading' && status !== 'error' && (
              <button
                type="button"
                onClick={handleUpload}
                className="btn-primary"
                style={{ marginTop: '16px', width: '100%', height: '52px' }}
              >
                Analysieren & ablegen
              </button>
            )}
          </>
        )}

        {status === 'uploading' && (
          <section style={{ border: '1px solid #262626', borderRadius: '12px', backgroundColor: '#141414', padding: '16px' }}>
            {steps.map((step, index) => {
              const stepNumber = index + 1;
              const isDone = activeStep > stepNumber;
              const isActive = activeStep === stepNumber;
              const textColor = isActive ? '#fff' : isDone ? '#888' : '#555';

              return (
                <div key={step.title} style={{ display: 'flex', gap: '12px', padding: '10px 0' }}>
                  <div style={{ marginTop: '2px' }}>
                    {isDone ? (
                      <div style={{ width: '16px', height: '16px', borderRadius: '999px', border: '1px solid #22c55e', display: 'grid', placeItems: 'center' }}>
                        <IconCheck size={11} />
                      </div>
                    ) : isActive ? (
                      <Spinner size={16} />
                    ) : (
                      <div style={{ width: '16px', height: '16px', borderRadius: '999px', border: '1px solid #333' }} />
                    )}
                  </div>
                  <div>
                    <p style={{ margin: 0, color: textColor, fontSize: '15px', fontWeight: 500 }}>{step.title}</p>
                    <p style={{ margin: '2px 0 0', color: '#555', fontSize: '14px' }}>{step.text}</p>
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {(status === 'success' || status === 'duplicate') && result && (
          <section style={{ textAlign: 'center' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '999px',
                border: `1px solid ${status === 'success' ? '#22c55e' : '#f59e0b'}`,
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 12px',
              }}
            >
              {status === 'success' ? (
                <IconCheck />
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 7v6m0 4h.01" stroke="#f59e0b" strokeWidth="2.2" strokeLinecap="round" />
                  <path d="M12 3 2.6 20h18.8L12 3Z" stroke="#f59e0b" strokeWidth="1.6" />
                </svg>
              )}
            </div>

            <h2 style={{ margin: '0 0 8px', fontSize: '20px', fontWeight: 600, color: '#fff' }}>
              {status === 'success' ? 'Erfolgreich abgelegt' : 'Bereits gespeichert'}
            </h2>
            {status === 'duplicate' ? (
              <p style={{ margin: '0 0 14px', color: '#888', fontSize: '14px' }}>
                Dieses Dokument ist bereits in deinem Drive vorhanden.
              </p>
            ) : null}

            <div style={{ backgroundColor: '#141414', border: '1px solid #262626', borderRadius: '8px', padding: '16px', textAlign: 'left' }}>
              <p style={{ margin: '0 0 8px', display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                <span style={{ color: '#555' }}>Kategorie</span>
                <span style={{ color: '#fff' }}>{result.analysis?.ordner || '-'}</span>
              </p>
              <p style={{ margin: '0 0 8px', display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                <span style={{ color: '#555' }}>Datei</span>
                <span style={{ color: '#fff', fontSize: '13px', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
                  {result.storage?.path || '-'}
                </span>
              </p>
              <p style={{ margin: 0, display: 'flex', justifyContent: 'space-between', gap: '10px' }}>
                <span style={{ color: '#555' }}>Google Drive</span>
                {result.storage?.webViewLink ? (
                  <a href={result.storage.webViewLink} target="_blank" rel="noreferrer" style={{ color: '#6366f1', textDecoration: 'none' }}>
                    {status === 'duplicate' ? 'Vorhandene Datei öffnen →' : 'Öffnen →'}
                  </a>
                ) : (
                  <span style={{ color: '#ef4444', fontSize: '13px' }}>{result.storage?.error || 'Nicht verfügbar'}</span>
                )}
              </p>
            </div>

            {status === 'duplicate' ? (
              <div style={{ marginTop: '16px', display: 'grid', gap: '10px' }}>
                {result.storage?.webViewLink ? (
                  <a
                    href={result.storage.webViewLink}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: '#6366f1',
                      textDecoration: 'none',
                      height: '44px',
                      display: 'grid',
                      placeItems: 'center',
                      border: '1px solid #262626',
                      borderRadius: '8px',
                    }}
                  >
                    Vorhandene Datei öffnen →
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={() => handleUpload(true)}
                  className="btn-outline"
                  style={{ width: '100%', height: '48px' }}
                >
                  Trotzdem neu ablegen
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => resetUpload(false)}
                className="btn-outline"
                style={{ marginTop: '16px', width: '100%', height: '48px' }}
              >
                Weiteres Dokument
              </button>
            )}
          </section>
        )}
      </div>

      <style>{`
        .btn-primary {
          background: #6366f1;
          border: none;
          border-radius: 8px;
          color: #fff;
          font-weight: 500;
          font-size: 15px;
          cursor: pointer;
          transition: background-color .18s ease;
        }
        .btn-primary:hover { background: #4f46e5; }

        .btn-secondary {
          height: 44px;
          border-radius: 8px;
          border: 1px solid #262626;
          background: #1a1a1a;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 14px;
          cursor: pointer;
        }

        .btn-outline {
          border: 1px solid #262626;
          background: transparent;
          border-radius: 8px;
          color: #fff;
          font-size: 15px;
          cursor: pointer;
        }

        .logout-button:hover { color: #fff; }

        .spinner {
          display: inline-block;
          border-radius: 999px;
          border: 2px solid #2f2f2f;
          border-top-color: #6366f1;
          animation: spin .8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}

export default Upload;
