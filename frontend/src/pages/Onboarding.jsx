import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import api from '../services/api';

function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
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
      <span style={{ color: '#111827', fontSize: '18px', fontWeight: 700 }}>DokuHero</span>
    </div>
  );
}

export default function Onboarding() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('dokuhero_token');
    if (!token) {
      navigate('/');
    }
  }, [navigate]);

  const saveProvider = async (provider) => {
    if (saving) return;
    setSaving(provider);
    setError('');
    try {
      await api.post('/api/user/storage-provider', { provider });
      localStorage.setItem('dokuhero_storage_provider', provider);
      if (provider === 'google_drive') {
        const userId = localStorage.getItem('dokuhero_user_id');
        if (!userId) {
          setError('User-ID fehlt. Bitte neu einloggen.');
          return;
        }
        window.location.href = `/api/auth/drive?user_id=${encodeURIComponent(userId)}`;
        return;
      }
      navigate('/upload');
    } catch (e) {
      setError(e?.response?.data?.error || 'Speichern fehlgeschlagen');
    } finally {
      setSaving('');
    }
  };

  const cardStyle = {
    background: '#fff',
    borderRadius: '16px',
    padding: '20px',
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#f3f4f6',
        color: '#111827',
        fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '28px 20px 40px' }}>
        <header style={{ display: 'grid', placeItems: 'center' }}>
          <Logo />
        </header>

        <section style={{ marginTop: '24px', textAlign: 'center' }}>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700 }}>
            Wo sollen deine Dokumente gespeichert werden?
          </h1>
          <p style={{ margin: '8px 0 0', fontSize: '14px', color: '#9ca3af' }}>
            Du kannst das später in den Einstellungen ändern.
          </p>
        </section>

        {error ? (
          <p style={{ margin: '14px 0 0', color: '#dc2626', fontSize: '13px', textAlign: 'center' }}>{error}</p>
        ) : null}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
          <article style={{ ...cardStyle, border: '2px solid #6366f1' }}>
            <span
              style={{
                display: 'inline-block',
                background: '#eef2ff',
                color: '#6366f1',
                fontSize: '12px',
                borderRadius: '20px',
                padding: '4px 12px',
                fontWeight: 600,
              }}
            >
              Empfohlen
            </span>
            <div style={{ marginTop: '12px', fontSize: '40px', lineHeight: 1 }}>🇩🇪</div>
            <h2 style={{ margin: '12px 0 0', fontSize: '16px', fontWeight: 700 }}>DokuHero Tresor</h2>
            <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#6b7280' }}>
              Deine Dokumente liegen verschlüsselt auf deutschen Servern. Nur du hast Zugriff.
            </p>
            <ul style={{ margin: '12px 0 0', padding: 0, listStyle: 'none', fontSize: '13px', color: '#374151' }}>
              <li>✓ DSGVO-konform</li>
              <li>✓ Verschlüsselt in Deutschland</li>
              <li>✓ Kein Google-Zugriff</li>
            </ul>
            <button
              type="button"
              onClick={() => saveProvider('hetzner')}
              disabled={Boolean(saving)}
              style={{
                marginTop: '14px',
                width: '100%',
                border: 'none',
                borderRadius: '10px',
                padding: '14px',
                background: '#6366f1',
                color: '#fff',
                fontWeight: 600,
                fontSize: '14px',
                cursor: saving ? 'wait' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {saving === 'hetzner' ? 'Speichern...' : 'Tresor wählen'}
            </button>
          </article>

          <article style={{ ...cardStyle, border: '1px solid #e5e7eb' }}>
            <div style={{ marginTop: '2px', fontSize: '36px', lineHeight: 1 }}>📁</div>
            <h2 style={{ margin: '12px 0 0', fontSize: '16px', fontWeight: 700 }}>Google Drive</h2>
            <p style={{ margin: '8px 0 0', fontSize: '13px', color: '#6b7280' }}>
              Dokumente werden in deinem persönlichen Google Drive gespeichert.
            </p>
            <ul style={{ margin: '12px 0 0', padding: 0, listStyle: 'none', fontSize: '13px', color: '#374151' }}>
              <li>✓ In deiner Google-Infrastruktur</li>
              <li>✓ Überall zugänglich</li>
              <li>✓ Google Drive Suche</li>
            </ul>
            <button
              type="button"
              onClick={() => saveProvider('google_drive')}
              disabled={Boolean(saving)}
              style={{
                marginTop: '14px',
                width: '100%',
                border: '1px solid #6366f1',
                borderRadius: '10px',
                padding: '14px',
                background: '#fff',
                color: '#6366f1',
                fontWeight: 600,
                fontSize: '14px',
                cursor: saving ? 'wait' : 'pointer',
                fontFamily: 'inherit',
              }}
            >
              {saving === 'google_drive' ? 'Speichern...' : 'Google Drive wählen'}
            </button>
          </article>
        </div>
      </div>
    </main>
  );
}
