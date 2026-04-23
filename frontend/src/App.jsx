import { Route, Routes } from 'react-router-dom';

import Documents from './pages/Documents';
import Login from './pages/Login';
import Upload from './pages/Upload';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/upload" element={<Upload />} />
      <Route path="/documents" element={<Documents />} />
    </Routes>
  );
}

export default App;
