import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true">
      <path
        d="M20 12.2c0-.64-.06-1.25-.17-1.84H12v3.48h4.48a3.84 3.84 0 0 1-1.67 2.52v2.1h2.7c1.58-1.46 2.49-3.62 2.49-6.26Z"
        fill="#fff"
      />
      <path
        d="M12 20.3c2.26 0 4.16-.74 5.54-2l-2.7-2.1c-.75.5-1.7.79-2.84.79-2.19 0-4.05-1.48-4.72-3.46H4.5v2.17a8.3 8.3 0 0 0 7.5 4.6Z"
        fill="#fff"
      />
      <path d="M7.28 13.53A4.97 4.97 0 0 1 7 12c0-.53.1-1.04.28-1.53V8.3H4.5A8.3 8.3 0 0 0 3.7 12c0 1.35.32 2.62.8 3.7l2.78-2.17Z" fill="#fff" />
      <path
        d="M12 7.01c1.23 0 2.34.43 3.21 1.28l2.4-2.4C16.15 4.54 14.26 3.7 12 3.7A8.3 8.3 0 0 0 4.5 8.3l2.78 2.17c.67-1.98 2.53-3.46 4.72-3.46Z"
        fill="#fff"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 24 24" width="12" height="12" fill="none" aria-hidden="true">
      <path d="M5 12.8 9.5 17 19 7.5" stroke="#6366f1" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Login() {
  const navigate = useNavigate();

  useEffect(() => {
    const existingToken = localStorage.getItem('dokuhero_token');
    if (existingToken) {
      navigate('/upload');
    }
  }, [navigate]);

  const handleGoogleLogin = () => {
    window.location.href = 'https://dokuhero.de/api/auth/google';
  };

  return (
    <main style={styles.page}>
      <section
        style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: '#ffffff',
          borderRadius: '20px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.1)',
          padding: '40px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
          <div style={styles.logoBox}>D</div>
          <span style={styles.logoText}>DokuHero</span>
        </div>
        <h1
          style={{
            margin: '0 0 8px',
            fontSize: '26px',
            lineHeight: 1.2,
            fontWeight: 700,
            color: '#111827',
          }}
        >
          Schluss mit dem Dokumentenchaos.
        </h1>
        <p style={{ margin: '0 0 28px', color: '#6b7280', fontSize: '15px', lineHeight: 1.6 }}>
          Foto scannen — KI erkennt Typ und Absender — automatisch in Google Drive sortiert.
        </p>

        <button type="button" onClick={handleGoogleLogin} className="login-google-button">
          <GoogleIcon />
          <span>Mit Google anmelden</span>
        </button>

        <div style={{ height: '1px', backgroundColor: '#e5e7eb', margin: '24px 0' }} />

        <div style={{ display: 'grid', gap: '12px' }}>
          {[
            'In 30 Sekunden sortiert — kein manuelles Ablegen',
            'Alles bleibt in deinem Google Drive',
            'KI erkennt Absender, Typ und Datum automatisch',
          ].map((item) => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={styles.featureBadge}>
                <CheckIcon />
              </div>
              <span style={{ color: '#374151', fontSize: '14px', fontWeight: 500 }}>{item}</span>
            </div>
          ))}
        </div>

        <p style={{ margin: '24px 0 0', fontSize: '12px', color: '#9ca3af', textAlign: 'center' }}>
          Durch Anmelden stimmst du unseren Nutzungsbedingungen zu.
        </p>
      </section>

      <style>{`
        .login-google-button {
          width: 100%;
          height: 52px;
          border: none;
          border-radius: 10px;
          background: #6366f1;
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.15s ease;
        }
        .login-google-button:hover {
          background: #4f46e5;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99,102,241,0.4);
        }
      `}</style>
    </main>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    backgroundColor: '#f3f4f6',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  logoBox: {
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: '#6366f1',
    color: '#fff',
    display: 'grid',
    placeItems: 'center',
    fontSize: '20px',
    fontWeight: 700,
    lineHeight: 1,
  },
  logoText: {
    fontSize: '20px',
    fontWeight: 700,
    color: '#111827',
  },
  featureBadge: {
    width: '20px',
    height: '20px',
    borderRadius: '999px',
    backgroundColor: '#eef2ff',
    display: 'grid',
    placeItems: 'center',
    flexShrink: 0,
  },
};

export default Login;
