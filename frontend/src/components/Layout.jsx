import { Link } from 'react-router-dom';

function Layout({ children }) {
  return (
    <div style={{ fontFamily: 'Arial, sans-serif', margin: '0 auto', maxWidth: '960px', padding: '1rem' }}>
      <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h1>dokuhero</h1>
        <nav style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/login">Login</Link>
          <Link to="/upload">Upload</Link>
          <Link to="/documents">Documents</Link>
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}

export default Layout;
