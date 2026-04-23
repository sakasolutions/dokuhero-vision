import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#ffffff"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#ffffff"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#ffffff"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
      />
      <path
        fill="#ffffff"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
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
      <section style={styles.content}>
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
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  content: {
    width: '100%',
    maxWidth: '400px',
    margin: '0 auto',
    padding: '40px 24px',
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
