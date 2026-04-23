import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Logo({ small = false }) {
  const boxSize = small ? 28 : 34;
  const fontSize = small ? 18 : 22;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div
        style={{
          width: `${boxSize}px`,
          height: `${boxSize}px`,
          borderRadius: '8px',
          backgroundColor: '#6366f1',
          color: '#fff',
          display: 'grid',
          placeItems: 'center',
          fontWeight: 700,
          fontSize: `${fontSize}px`,
          lineHeight: 1,
        }}
      >
        D
      </div>
      <span style={{ color: '#fff', fontSize: '20px', fontWeight: 600 }}>DokuHero</span>
    </div>
  );
}

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

function FeatureIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="#6366f1" strokeWidth="2" />
      <path d="M8 12.5 10.8 15 16 9" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
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
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        backgroundColor: '#0a0a0a',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        position: 'relative',
      }}
    >
      <div style={{ position: 'absolute', left: '20px', top: '20px' }}>
        <Logo small />
      </div>
      <section
        style={{
          width: '100%',
          maxWidth: '400px',
          backgroundColor: '#141414',
          borderRadius: '12px',
          border: '1px solid #262626',
          padding: '48px 24px',
        }}
      >
        <h1
          style={{
            margin: '0 0 12px',
            fontSize: '28px',
            lineHeight: 1.2,
            fontWeight: 600,
            color: '#fff',
          }}
        >
          Dokumente automatisch organisieren.
        </h1>
        <p style={{ margin: '0 0 32px', color: '#888', fontSize: '15px', lineHeight: 1.5 }}>
          Foto scannen. KI erkennt. Google Drive sortiert.
        </p>

        <button type="button" onClick={handleGoogleLogin} className="btn-primary">
          <GoogleIcon />
          <span>Mit Google anmelden</span>
        </button>

        <div style={{ height: '1px', backgroundColor: '#262626', margin: '24px 0' }} />

        <div style={{ display: 'grid', gap: '12px' }}>
          {[
            'Dokumente in Sekunden sortiert',
            'Sicher in deinem Google Drive',
            'KI erkennt Typ und Absender',
          ].map((item) => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <FeatureIcon />
              <span style={{ color: '#888', fontSize: '14px' }}>{item}</span>
            </div>
          ))}
        </div>

        <p style={{ margin: '24px 0 0', fontSize: '13px', color: '#555' }}>
          Deine Dokumente bleiben in deinem Google Drive.
        </p>
      </section>

      <style>{`
        .btn-primary {
          width: 100%;
          height: 48px;
          border: none;
          border-radius: 8px;
          background: #6366f1;
          color: #fff;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: background-color 0.18s ease;
        }
        .btn-primary:hover {
          background: #4f46e5;
        }
      `}</style>
    </main>
  );
}

export default Login;
