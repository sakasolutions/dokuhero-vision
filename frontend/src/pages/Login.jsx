function Login() {
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
        backgroundColor: '#f8f9fa',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: '380px',
          backgroundColor: '#ffffff',
          borderRadius: '16px',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.08)',
          padding: '40px 24px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '64px', lineHeight: 1, marginBottom: '12px' }}>📄</div>
        <h1
          style={{
            margin: '0 0 12px',
            fontSize: '32px',
            lineHeight: 1.2,
            fontWeight: 700,
            color: '#1a1a1a',
          }}
        >
          DokuHero
        </h1>
        <p style={{ margin: '0 0 32px', color: '#666', fontSize: '16px' }}>
          Dokumente scannen. Automatisch sortiert.
        </p>

        <button
          type="button"
          onClick={handleGoogleLogin}
          style={{
            width: '100%',
            height: '48px',
            border: 'none',
            borderRadius: '8px',
            backgroundColor: '#4285F4',
            color: '#ffffff',
            fontSize: '1rem',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span>Mit Google anmelden</span>
        </button>

        <p style={{ margin: '24px 0 0', fontSize: '13px', color: '#999' }}>
          Deine Dokumente bleiben in deinem Google Drive.
        </p>
      </section>
    </main>
  );
}

export default Login;
