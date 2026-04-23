import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactCrop, { centerCrop, convertToPixelCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';

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
      <span style={{ color: '#111827', fontSize: '16px', fontWeight: 700 }}>DokuHero</span>
    </div>
  );
}

function IconCloudUpload() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

function IconArrowRight({ color = '#fff', size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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

function StepIcon({ state }) {
  if (state === 'done') {
    return (
      <div className="step-icon step-icon-done">
        <IconCheck size={14} color="#16a34a" />
      </div>
    );
  }

  if (state === 'active') {
    return (
      <div className="step-icon step-icon-active">
        <span className="spinner" style={{ width: '16px', height: '16px' }} />
      </div>
    );
  }

  return <div className="step-icon step-icon-pending" />;
}

function Upload() {
  const navigate = useNavigate();
  const [token, setToken] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [status, setStatus] = useState('idle');
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState('Bitte versuche es erneut.');
  const [progressStep, setProgressStep] = useState('step1_done');

  const [imgSrc, setImgSrc] = useState('');
  const [crop, setCrop] = useState();
  const [completedCrop, setCompletedCrop] = useState();
  const [showCropper, setShowCropper] = useState(false);
  const imgRef = useRef(null);
  const cameraInputRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem('dokuhero_token');
    localStorage.removeItem('dokuhero_refresh_token');
    navigate('/');
  };

  const revokePreviewIfBlob = (url) => {
    if (url && String(url).startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  };

  const onFileSelected = (selectedFile) => {
    if (!selectedFile) {
      return;
    }

    setResult(null);
    setStatus('idle');
    setErrorMessage('Bitte versuche es erneut.');

    if (selectedFile.type === 'application/pdf') {
      setShowCropper(false);
      setImgSrc('');
      setCrop(undefined);
      setCompletedCrop(undefined);
      revokePreviewIfBlob(preview);
      setFile(selectedFile);
      setPreview('');
      return;
    }

    if (selectedFile.type.startsWith('image/')) {
      setFile(null);
      revokePreviewIfBlob(preview);
      setPreview('');

      const reader = new FileReader();
      reader.onload = () => {
        setImgSrc((reader.result || ''));
        setShowCropper(true);
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const onImageLoad = (e) => {
    const img = e.currentTarget;
    const { width, height, naturalWidth, naturalHeight } = img;
    if (!width || !height) {
      return;
    }
    const imageAspect = naturalWidth / naturalHeight;
    const nextCrop = centerCrop(
      makeAspectCrop({ unit: '%', width: 90 }, imageAspect, width, height),
      width,
      height
    );
    setCrop(nextCrop);
    setCompletedCrop(convertToPixelCrop(nextCrop, width, height));
  };

  const getCroppedBlob = async () => {
    const image = imgRef.current;
    if (!image || !completedCrop || completedCrop.width < 1 || completedCrop.height < 1) {
      return null;
    }

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return null;
    }

    const sx = completedCrop.x * scaleX;
    const sy = completedCrop.y * scaleY;
    const sw = completedCrop.width * scaleX;
    const sh = completedCrop.height * scaleY;
    const pixelWidth = Math.max(1, Math.round(sw));
    const pixelHeight = Math.max(1, Math.round(sh));

    canvas.width = pixelWidth;
    canvas.height = pixelHeight;

    ctx.drawImage(image, sx, sy, sw, sh, 0, 0, pixelWidth, pixelHeight);

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas konnte nicht exportiert werden.'));
            return;
          }
          resolve(new File([blob], 'document.jpg', { type: 'image/jpeg' }));
        },
        'image/jpeg',
        0.92
      );
    });
  };

  const onCropConfirm = async () => {
    const cropped = await getCroppedBlob();
    if (!cropped) {
      return;
    }
    setFile(cropped);
    revokePreviewIfBlob(preview);
    const nextPreview = URL.createObjectURL(cropped);
    setPreview(nextPreview);
    setShowCropper(false);
    setImgSrc('');
    setCrop(undefined);
    setCompletedCrop(undefined);
  };

  const onCropCancel = () => {
    setShowCropper(false);
    setImgSrc('');
    setCrop(undefined);
    setCompletedCrop(undefined);
    setFile(null);
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = async (forceUpload = false) => {
    if (!file || !token) {
      return;
    }

    setStatus('uploading');
    setResult(null);
    setErrorMessage('Bitte versuche es erneut.');
    setProgressStep('step1_done');

    let step2Timer = null;
    let step3Timer = null;

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
      setProgressStep('step2_active');
    }, 800);

    try {
      const response = await uploadDocument(token);
      setProgressStep('step2_done_step3_active');
      step3Timer = window.setTimeout(() => {
        setProgressStep('step3_done');
      }, 500);
      await new Promise((resolve) => window.setTimeout(resolve, 520));
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
        setProgressStep('step2_done_step3_active');
        step3Timer = window.setTimeout(() => {
          setProgressStep('step3_done');
        }, 500);
        await new Promise((resolve) => window.setTimeout(resolve, 520));
        setResult(retryResponse.data);
        setStatus(retryResponse.data?.storage?.duplicate ? 'duplicate' : 'success');
      } catch (refreshError) {
        setErrorMessage(refreshError?.response?.data?.error || 'Sitzung abgelaufen. Bitte neu anmelden.');
        setStatus('error');
        navigate('/');
      }
    } finally {
      if (step2Timer) window.clearTimeout(step2Timer);
      if (step3Timer) window.clearTimeout(step3Timer);
    }
  };

  const resetUpload = () => {
    setShowCropper(false);
    setImgSrc('');
    setCrop(undefined);
    setCompletedCrop(undefined);
    if (cameraInputRef.current) {
      cameraInputRef.current.value = '';
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    revokePreviewIfBlob(preview);
    setFile(null);
    setPreview('');
    setResult(null);
    setStatus('idle');
    setErrorMessage('Bitte versuche es erneut.');
    setProgressStep('step1_done');
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

  const getStepState = (step) => {
    if (progressStep === 'step1_done') {
      if (step === 1) return 'done';
      return 'pending';
    }
    if (progressStep === 'step2_active') {
      if (step === 1) return 'done';
      if (step === 2) return 'active';
      return 'pending';
    }
    if (progressStep === 'step2_done_step3_active') {
      if (step === 1 || step === 2) return 'done';
      if (step === 3) return 'active';
    }
    if (progressStep === 'step3_done') return 'done';
    return 'pending';
  };

  return (
    <main style={styles.page}>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 10,
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #e5e7eb',
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
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              backgroundColor: 'transparent',
              color: '#6b7280',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
              transition: 'all 0.15s ease',
            }}
            className="logout-button"
          >
            <IconLogout />
          </button>
        </div>
      </header>

      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '20px' }}>
        {(status === 'idle' || (status === 'error' && !result)) && (
          <>
            <section
              style={{
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                padding: '24px',
                backgroundColor: '#ffffff',
                textAlign: 'center',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              }}
            >
              {showCropper ? (
                <div>
                  <p
                    style={{
                      margin: '0 0 4px',
                      fontSize: '16px',
                      fontWeight: 600,
                      color: '#111827',
                    }}
                  >
                    Dokument zuschneiden
                  </p>
                  <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#9ca3af' }}>
                    Schneide den Rand ab für bessere Erkennung
                  </p>
                  {imgSrc ? (
                    <ReactCrop
                      crop={crop}
                      onChange={(_, percentCrop) => setCrop(percentCrop)}
                      onComplete={(pixelCrop) => setCompletedCrop(pixelCrop)}
                      style={{ maxHeight: '400px', width: '100%' }}
                    >
                      <img
                        ref={imgRef}
                        alt="Zum Zuschneiden"
                        src={imgSrc}
                        onLoad={onImageLoad}
                        style={{ maxWidth: '100%', maxHeight: '400px' }}
                      />
                    </ReactCrop>
                  ) : null}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '10px',
                      marginTop: '16px',
                    }}
                  >
                    <button
                      type="button"
                      onClick={onCropCancel}
                      style={{
                        background: '#fff',
                        border: '1px solid #e5e7eb',
                        color: '#374151',
                        borderRadius: '10px',
                        height: '48px',
                        fontSize: '14px',
                        fontWeight: 500,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      Neu aufnehmen
                    </button>
                    <button
                      type="button"
                      onClick={onCropConfirm}
                      style={{
                        background: '#6366f1',
                        border: 'none',
                        color: '#fff',
                        borderRadius: '10px',
                        height: '48px',
                        fontSize: '14px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'inherit',
                      }}
                    >
                      Zuschnitt bestätigen
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      border: '2px dashed #d1d5db',
                      borderRadius: '12px',
                      padding: '36px 20px',
                      backgroundColor: '#fafafa',
                      marginBottom: '20px',
                    }}
                  >
                    <div style={{ marginBottom: '12px', display: 'grid', placeItems: 'center' }}>
                      <IconCloudUpload />
                    </div>
                    <p style={{ margin: '12px 0 0', fontSize: '17px', color: '#111827', fontWeight: 600 }}>Dokument hochladen</p>
                    <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#9ca3af' }}>JPG, PNG oder PDF — bis 10 MB</p>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <label className="btn-secondary" style={{ flex: 1 }}>
                      <IconCamera color="#6366f1" />
                      <span>Kamera</span>
                      <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          if (e.target.files[0]) {
                            onFileSelected(e.target.files[0]);
                          }
                        }}
                      />
                    </label>

                    <label className="btn-secondary" style={{ flex: 1 }}>
                      <IconFile color="#6366f1" />
                      <span>Datei</span>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*,application/pdf"
                        style={{ display: 'none' }}
                        onChange={(e) => {
                          if (e.target.files[0]) {
                            onFileSelected(e.target.files[0]);
                          }
                        }}
                      />
                    </label>
                  </div>
                </>
              )}

              {file && !showCropper && (
                <div style={{ marginTop: '16px', marginBottom: '16px' }}>
                  {preview ? (
                    <img
                      src={preview}
                      alt="Vorschau"
                      style={{
                        width: '100%',
                        maxHeight: '200px',
                        objectFit: 'contain',
                        borderRadius: '10px',
                        border: '1px solid #e5e7eb',
                        backgroundColor: '#f9fafb',
                      }}
                    />
                  ) : null}
                  <p
                    style={{
                      margin: '8px 0 0',
                      fontSize: '13px',
                      color: '#6b7280',
                      textAlign: 'center',
                      maxWidth: '100%',
                      padding: '0 20px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      boxSizing: 'border-box',
                    }}
                  >
                    {file.name}
                  </p>
                </div>
              )}
            </section>

            {status === 'error' ? (
              <div style={styles.errorCard}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    margin: '0 auto 12px',
                    borderRadius: '999px',
                    border: '3px solid #dc2626',
                    display: 'grid',
                    placeItems: 'center',
                  }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M7 7l10 10M17 7 7 17" stroke="#dc2626" strokeWidth="2.2" strokeLinecap="round" />
                  </svg>
                </div>
                <h2 style={styles.stateTitle}>Upload fehlgeschlagen</h2>
                <p style={styles.stateText}>{errorMessage}</p>
                <button type="button" className="btn-primary" onClick={() => resetUpload()}>
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
                <span>Analysieren & in Drive ablegen</span>
                <IconArrowRight />
              </button>
            )}
          </>
        )}

        {status === 'uploading' && (
          <section style={styles.uploadingCard}>
            <h2 style={{ margin: '0 0 24px', fontSize: '17px', fontWeight: 600, color: '#111827' }}>Wird verarbeitet...</h2>
            {[
              { title: 'Dokument empfangen', text: 'Datei erfolgreich übertragen' },
              { title: 'KI analysiert', text: 'Typ, Absender und Datum werden erkannt' },
              { title: 'Google Drive', text: 'Datei wird im richtigen Ordner abgelegt' },
            ].map((step, index, all) => {
              const stepNumber = index + 1;
              const state = getStepState(stepNumber);
              const textColor = state === 'done' ? '#16a34a' : state === 'active' ? '#111827' : '#9ca3af';

              return (
                <div
                  key={step.title}
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '14px',
                    padding: '14px 0',
                    borderBottom: index < all.length - 1 ? '1px solid #f3f4f6' : 'none',
                  }}
                >
                  <StepIcon state={state} />
                  <div>
                    <p style={{ margin: 0, color: textColor, fontSize: '14px', fontWeight: 600 }}>{step.title}</p>
                    <p style={{ margin: '2px 0 0', color: '#9ca3af', fontSize: '13px' }}>{step.text}</p>
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
                width: '64px',
                height: '64px',
                borderRadius: '999px',
                border: `3px solid ${status === 'success' ? '#16a34a' : '#d97706'}`,
                display: 'grid',
                placeItems: 'center',
                margin: '0 auto 20px',
                animation: status === 'success' ? 'scaleIn .3s ease' : 'none',
              }}
            >
              {status === 'success' ? (
                <IconCheck size={28} color="#16a34a" />
              ) : (
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M12 7v6m0 4h.01" stroke="#d97706" strokeWidth="2.2" strokeLinecap="round" />
                  <path d="M12 3 2.6 20h18.8L12 3Z" stroke="#d97706" strokeWidth="1.8" />
                </svg>
              )}
            </div>

            <h2 style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 700, color: '#111827' }}>
              {status === 'success' ? 'Erfolgreich abgelegt!' : 'Bereits gespeichert'}
            </h2>
            <p
              style={{
                margin: '0 0 12px',
                color: '#6b7280',
                fontSize: '14px',
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                maxWidth: '100%',
                padding: '0 20px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                boxSizing: 'border-box',
              }}
            >
              {result.storage?.fileName || result.storage?.path || '-'}
            </p>
            {status === 'duplicate' && (
              <p style={{ margin: '0 0 14px', color: '#6b7280', fontSize: '14px' }}>
                Dieses Dokument ist bereits in deinem Drive vorhanden.
              </p>
            )}

            <div style={styles.infoCard}>
              <p style={styles.infoRow}>
                <span style={styles.infoLabel}>Kategorie</span>
                <span style={styles.infoValueText}>{result.analysis?.ordner || '-'}</span>
              </p>
              <p style={styles.infoRow}>
                <span style={styles.infoLabel}>Datei</span>
                <span
                  style={{
                    ...styles.infoValueFile,
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  }}
                >
                  {result.storage?.path || '-'}
                </span>
              </p>
              <p style={styles.infoRowLast}>
                <span style={styles.infoLabel}>Google Drive</span>
                {result.storage?.webViewLink ? (
                  <a
                    href={result.storage.webViewLink}
                    target="_blank"
                    rel="noreferrer"
                    style={styles.infoLink}
                  >
                    Öffnen →
                  </a>
                ) : (
                  <span style={styles.infoValueError}>
                    {result.storage?.error || 'Nicht verfügbar'}
                  </span>
                )}
              </p>
            </div>

            {status === 'duplicate' ? (
              <div style={{ marginTop: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {result.storage?.webViewLink ? (
                  <a
                    href={result.storage.webViewLink}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: '#374151',
                      textDecoration: 'none',
                      height: '48px',
                      display: 'grid',
                      placeItems: 'center',
                      border: '1px solid #e5e7eb',
                      borderRadius: '10px',
                      backgroundColor: '#fff',
                      fontWeight: 500,
                      fontSize: '14px',
                    }}
                  >
                    Datei öffnen
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={() => handleUpload(true)}
                  className="btn-primary"
                  style={{ width: '100%', height: '48px' }}
                >
                  Neu ablegen
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={resetUpload}
                className="btn-outline"
                style={{ marginTop: '16px', width: '100%', height: '48px' }}
              >
                Weiteres Dokument scannen
              </button>
            )}
          </section>
        )}
      </div>

      <style>{`
        .btn-primary {
          background: #6366f1;
          border: none;
          border-radius: 10px;
          color: #fff;
          font-weight: 600;
          font-size: 15px;
          cursor: pointer;
          transition: all .15s ease;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }
        .btn-primary:hover {
          background: #4f46e5;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99,102,241,0.4);
        }

        .btn-secondary {
          height: 48px;
          border-radius: 10px;
          border: 1px solid #e5e7eb;
          background: #fff;
          color: #374151;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all .15s ease;
        }
        .btn-secondary:hover {
          border-color: #6366f1;
          background: #eef2ff;
        }

        .btn-outline {
          border: 1px solid #e5e7eb;
          background: #fff;
          border-radius: 10px;
          color: #374151;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          transition: all .15s ease;
        }
        .btn-outline:hover {
          border-color: #6366f1;
          color: #6366f1;
        }

        .logout-button:hover {
          color: #111827;
          background: #f3f4f6;
        }

        .spinner {
          display: inline-block;
          border-radius: 999px;
          border: 2px solid #e5e7eb;
          border-top-color: #6366f1;
          animation: spin .8s linear infinite;
        }

        .step-icon {
          width: 24px;
          height: 24px;
          border-radius: 999px;
          flex-shrink: 0;
          margin-top: 2px;
          display: grid;
          place-items: center;
        }
        .step-icon-pending {
          border: 2px solid #e5e7eb;
          background: #fff;
        }
        .step-icon-active {
          border: 2px solid #e5e7eb;
          background: #fff;
        }
        .step-icon-done {
          border: 1px solid #bbf7d0;
          background: #f0fdf4;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes scaleIn {
          from { transform: scale(0.8); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </main>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#f3f4f6',
    color: '#111827',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  uploadingCard: {
    backgroundColor: '#fff',
    borderRadius: '16px',
    border: '1px solid #e5e7eb',
    padding: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  errorCard: {
    marginTop: '16px',
    backgroundColor: '#fff',
    border: '1px solid #e5e7eb',
    borderRadius: '16px',
    padding: '20px',
    textAlign: 'center',
    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
  },
  stateTitle: {
    margin: '0 0 8px',
    fontSize: '22px',
    fontWeight: 700,
    color: '#111827',
  },
  stateText: {
    margin: '0 0 14px',
    color: '#6b7280',
    fontSize: '14px',
  },
  infoCard: {
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '12px',
    padding: '16px',
    marginTop: '20px',
    textAlign: 'left',
  },
  infoLabel: {
    color: '#9ca3af',
    fontSize: '13px',
    fontWeight: 500,
    flexShrink: 0,
  },
  infoRow: {
    margin: '0 0 8px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    minWidth: 0,
    padding: '8px 0',
    borderBottom: '1px solid #f3f4f6',
  },
  infoRowLast: {
    margin: 0,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '12px',
    minWidth: 0,
    padding: '8px 0 0',
  },
  infoValueText: {
    color: '#111827',
    fontSize: '13px',
    fontWeight: 600,
    minWidth: 0,
    maxWidth: '65%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    textAlign: 'right',
  },
  infoValueFile: {
    color: '#111827',
    fontSize: '13px',
    fontWeight: 600,
    minWidth: 0,
    maxWidth: '60%',
    wordBreak: 'break-all',
    textAlign: 'right',
  },
  infoLink: {
    color: '#6366f1',
    textDecoration: 'none',
    fontSize: '13px',
    fontWeight: 600,
    flexShrink: 0,
  },
  infoValueError: {
    color: '#dc2626',
    fontSize: '13px',
    fontWeight: 600,
    minWidth: 0,
    maxWidth: '65%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    textAlign: 'right',
  },
};

export default Upload;
