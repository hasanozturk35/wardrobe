import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from './components/shared/MainLayout';
import { ProtectedRoute } from './components/shared/ProtectedRoute';
import WardrobePage from './pages/WardrobePage';
import AuthPage from './pages/AuthPage';
import StudioPage from './pages/StudioPage';
import LookbookPage from './pages/LookbookPage';
import DiscoverPage from './pages/DiscoverPage';
import SocialFeedPage from './pages/SocialFeedPage';
import CalendarPage from './pages/CalendarPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AvatarOnboarding from './avatar/pages/AvatarOnboarding';
import AvatarProfilePage from './avatar/pages/AvatarProfilePage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AdminDashboard from './pages/AdminDashboard';

function App() {
  return (
    <Router>
      <div className="w-full min-h-screen">
        <Routes>
          <Route path="/" element={<Navigate to="/auth" replace />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <MainLayout>
                <Routes>
                  <Route path="/wardrobe" element={<WardrobePage />} />
                  <Route path="/studio" element={<StudioPage />} />
                  <Route path="/lookbook" element={<LookbookPage />} />
                  <Route path="/discover" element={<DiscoverPage />} />
                  <Route path="/feed" element={<SocialFeedPage />} />
                  <Route path="/calendar" element={<CalendarPage />} />
                  <Route path="/analytics" element={<AnalyticsPage />} />
                  <Route path="/avatar/onboarding" element={<AvatarOnboarding />} />
                  <Route path="/avatar/profile" element={<AvatarProfilePage />} />
                  <Route path="/admin" element={<AdminDashboard />} />
                </Routes>
              </MainLayout>
            </ProtectedRoute>
          } />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
