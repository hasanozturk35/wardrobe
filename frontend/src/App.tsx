import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import WardrobePage from './pages/WardrobePage';
import AuthPage from './pages/AuthPage';
import StudioPage from './pages/StudioPage';

function App() {
  return (
    <Router>
      <div className="w-full min-h-screen bg-gray-50">
        <Routes>
          <Route path="/" element={<Navigate to="/auth" replace />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/wardrobe" element={<WardrobePage />} />
          <Route path="/studio" element={<StudioPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
