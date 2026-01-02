import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SettingsProvider } from './contexts/SettingsContext';
import LoginPage from './pages/LoginPage';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';

import CreateRoomPage from './pages/CreateRoomPage';
import LobbyPage from './pages/LobbyPage';
import SpyfallPage from './pages/SpyfallPage';
import GamePage from './pages/GamePage';

// Güvenlik Görevlisi: Giriş yapmamışsa Login'e atar
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

// Yönlendirici: Zaten giriş yapmışsa Login sayfasını gösterme, Home'a at
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  return user ? <Navigate to="/" replace /> : <>{children}</>;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <SettingsProvider>
          <Routes>
            {/* Giriş Sayfası Rotaları */}
            <Route path="/login" element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            } />

            {/* Korumalı Alanlar (Sadece giriş yapanlar) */}
            <Route path="/" element={
              <PrivateRoute>
                <HomePage />
              </PrivateRoute>
            } />

            <Route path="/spyfall" element={
              <PrivateRoute>
                <SpyfallPage />
              </PrivateRoute>
            } />

            <Route path="/create" element={
              <PrivateRoute>
                <CreateRoomPage />
              </PrivateRoute>
            } />

            <Route path="/lobby/:roomId" element={
              <PrivateRoute>
                <LobbyPage />
              </PrivateRoute>
            } />

            <Route path="/game/:roomId" element={
              <PrivateRoute>
                <GamePage />
              </PrivateRoute>
            } />

            <Route path="/profile" element={
              <PrivateRoute>
                <ProfilePage />
              </PrivateRoute>
            } />

            <Route path="/settings" element={
              <PrivateRoute>
                <SettingsPage />
              </PrivateRoute>
            } />

            {/* Bilinmeyen rotaları ana sayfaya yönlendir */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SettingsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;