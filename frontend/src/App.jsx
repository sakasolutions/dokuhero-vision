import { Route, Routes } from 'react-router-dom';

import Datenschutz from './pages/Datenschutz';
import Documents from './pages/Documents';
import Impressum from './pages/Impressum';
import Login from './pages/Login';
import Upload from './pages/Upload';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/upload" element={<Upload />} />
      <Route path="/documents" element={<Documents />} />
      <Route path="/impressum" element={<Impressum />} />
      <Route path="/datenschutz" element={<Datenschutz />} />
    </Routes>
  );
}

export default App;
