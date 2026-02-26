import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import DetectPage from './pages/DetectPage';
import ResultsPage from './pages/ResultsPage';
import ChatPage from './pages/ChatPage';
import HistoryPage from './pages/HistoryPage';
import AboutPage from './pages/AboutPage';
import LoadingSpinner from './components/LoadingSpinner';
import FloatingChat from './components/FloatingChat';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center gradient-bg">
        <LoadingSpinner text="Loading..." />
      </div>
    );
  }

  return user ? children : <Navigate to="/auth" />;
}

export default function App() {
  const { user, loading } = useAuth();

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#1e293b',
            color: '#f1f5f9',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '12px',
          },
          success: { iconTheme: { primary: '#22c55e', secondary: '#fff' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#fff' } },
        }}
      />

      <Routes>
        {/* Auth route: redirect to home if already logged in */}
        <Route
          path="/auth"
          element={
            loading ? (
              <div className="min-h-screen flex items-center justify-center gradient-bg">
                <LoadingSpinner text="Loading..." />
              </div>
            ) : user ? (
              <Navigate to="/" />
            ) : (
              <div className="min-h-screen gradient-bg">
                <AuthPage />
              </div>
            )
          }
        />

        {/* Protected routes with layout */}
        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<HomePage />} />
          <Route path="/detect" element={<DetectPage />} />
          <Route path="/results" element={<ResultsPage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/about" element={<AboutPage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

      {/* Global floating chatbot — visible on all pages when authenticated */}
      {user && <FloatingChat />}
    </>
  );
}
