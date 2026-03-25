import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/shared/MainLayout';
import WardrobePage from './pages/WardrobePage';
import AuthPage from './pages/AuthPage';
import StudioPage from './pages/StudioPage';
import LookbookPage from './pages/LookbookPage';
import DiscoverPage from './pages/DiscoverPage';
import SocialFeedPage from './pages/SocialFeedPage';
import CalendarPage from './pages/CalendarPage';

function App() {
  return (
    <Router>
      <div className="w-full min-h-screen">
        <Routes>
          <Route path="/" element={<Navigate to="/auth" replace />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="*" element={
            <MainLayout>
              <Routes>
                <Route path="/wardrobe" element={<WardrobePage />} />
                <Route path="/studio" element={<StudioPage />} />
                <Route path="/lookbook" element={<LookbookPage />} />
                <Route path="/discover" element={<DiscoverPage />} />
                <Route path="/feed" element={<SocialFeedPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
              </Routes>
            </MainLayout>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
