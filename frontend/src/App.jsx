import React, { useState, useEffect, useCallback } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

// ── Core pages ──────────────────────────────────────────────────────────────
import LoginPage        from './LoginPage';
import RegisterPage     from './RegisterPage';
import HomePage         from './HomePage';
import CartPage         from './CartPage';
import MyRentalsPage    from './MyRentalsPage';
import KYCPage          from './KYCPage';
import AdminDashboard   from './AdminDashboard';
import AdminLoginPage   from './AdminLoginPage';
import OwnerDashboard   from './OwnerDashboard';
import RentoraConcierge from './RentoraConcierge';

// ── Error / system pages ─────────────────────────────────────────────────────
import ErrorBoundary    from './ErrorBoundary';
import NotFoundPage     from './NotFoundPage';
import ForbiddenPage    from './ForbiddenPage';
import SessionExpiredPage from './SessionExpiredPage';
import OfflinePage      from './OfflinePage';

// ── Legal / info pages ────────────────────────────────────────────────────────
import {
  TermsPage,
  PrivacyPage,
  CookiesPage,
  RefundPolicyPage,
  FAQPage,
  ContactPage
} from './LegalPages';

// ── Route guards ─────────────────────────────────────────────────────────────
import {
  ProtectedRoute,
  RoleRoute,
  GuestRoute
} from './RouteGuards';

/* ══════════════════════════════════════════════════════════════════════════
   App
   ══════════════════════════════════════════════════════════════════════════ */
function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(
    () => !!localStorage.getItem('access_token')
  );
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // ── Auth helpers ──────────────────────────────────────────────────────────
  const handleLogin = useCallback(() => {
    setIsAuthenticated(true);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_role');
    setIsAuthenticated(false);
  }, []);

  // ── Keep auth state in sync across tabs ───────────────────────────────────
  useEffect(() => {
    const onStorage = () => {
      setIsAuthenticated(!!localStorage.getItem('access_token'));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  // ── Online / offline detection ────────────────────────────────────────────
  useEffect(() => {
    const goOnline  = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online',  goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online',  goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  // Show offline page when network is gone
  if (!isOnline) {
    return <OfflinePage />;
  }

  return (
    <Router>
      <ErrorBoundary>
        <Routes>
          {/* ── Auth (guest-only) ─────────────────────────────────────────── */}
          <Route
            path="/login"
            element={
              <GuestRoute>
                <LoginPage onLogin={handleLogin} />
              </GuestRoute>
            }
          />
          <Route
            path="/register"
            element={
              <GuestRoute>
                <RegisterPage onLogin={handleLogin} />
              </GuestRoute>
            }
          />

          {/* ── Admin login (public – has its own auth logic) ─────────────── */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* ── System / error pages ─────────────────────────────────────── */}
          <Route path="/404"             element={<NotFoundPage />} />
          <Route path="/403"             element={<ForbiddenPage />} />
          <Route path="/session-expired" element={<SessionExpiredPage />} />
          <Route path="/offline"         element={<OfflinePage />} />

          {/* ── Legal & informational pages (public) ─────────────────────── */}
          <Route path="/terms"           element={<TermsPage />} />
          <Route path="/privacy"         element={<PrivacyPage />} />
          <Route path="/cookies"         element={<CookiesPage />} />
          <Route path="/refund-policy"   element={<RefundPolicyPage />} />
          <Route path="/faq"             element={<FAQPage />} />
          <Route path="/contact"         element={<ContactPage />} />

          {/* ── Protected customer routes ─────────────────────────────────── */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <HomePage onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cart"
            element={
              <ProtectedRoute>
                <CartPage onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/rentals"
            element={
              <ProtectedRoute>
                <MyRentalsPage onLogout={handleLogout} />
              </ProtectedRoute>
            }
          />
          <Route
            path="/kyc"
            element={
              <ProtectedRoute>
                <KYCPage />
              </ProtectedRoute>
            }
          />

          {/* ── Owner dashboard (role-gated) ──────────────────────────────── */}
          <Route
            path="/owner"
            element={
              <RoleRoute role="owner">
                <OwnerDashboard onLogout={handleLogout} />
              </RoleRoute>
            }
          />

          {/* ── Admin dashboard (role-gated) ──────────────────────────────── */}
          <Route
            path="/admin"
            element={
              <RoleRoute role="admin">
                <AdminDashboard onLogout={handleLogout} />
              </RoleRoute>
            }
          />

          {/* ── 404 catch-all ────────────────────────────────────────────── */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>

        {/* Global AI concierge – shown on all pages */}
        <RentoraConcierge />
      </ErrorBoundary>
    </Router>
  );
}

export default App;
