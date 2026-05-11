import { Outlet, Route, Routes } from 'react-router-dom';

import Datenschutz from './pages/Datenschutz';
import Documents from './pages/Documents';
import FolderView from './pages/FolderView';
import Impressum from './pages/Impressum';
import Inbox from './pages/Inbox';
import Landing from './pages/Landing';
import Onboarding from './pages/Onboarding';
import Settings from './pages/Settings';
import Upload from './pages/Upload';

/** Phone-Viewport-Frame nur für die App — Landing bleibt full-width. */
function AppShell() {
  return (
    <div className="app-shell">
      <div className="app-shell__viewport">
        <Outlet />
      </div>
    </div>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route element={<AppShell />}>
        <Route path="/upload" element={<Upload />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/documents/folder/:category/:subcategory" element={<FolderView />} />
        <Route path="/documents/folder/:category" element={<FolderView />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/inbox" element={<Inbox />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/impressum" element={<Impressum />} />
        <Route path="/datenschutz" element={<Datenschutz />} />
      </Route>
    </Routes>
  );
}

export default App;
