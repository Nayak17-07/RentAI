import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Clock, LogIn, RefreshCw } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

/**
 * SessionExpiredPage
 * Shown when the user's access + refresh token have both expired.
 * The fetchWithAuth utility clears localStorage and hard-redirects to /login;
 * wrapping that target in a proper component gives context and avoids a blank page.
 */
const SessionExpiredPage = () => {
  const navigate = useNavigate();

  const handleSignIn = () => {
    // Make sure stale tokens are cleared before routing
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    navigate('/login', { replace: true });
  };

  return (
    <>
      <title>Session Expired | Rentora</title>
      <meta name="description" content="Your session has expired. Please sign in again." />
      <meta name="robots" content="noindex" />

      <div style={{
        minHeight: '100vh', background: 'var(--bg-color)',
        display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif'
      }}>
        {/* Header */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem 2rem', borderBottom: '1px solid var(--border-color)',
          background: 'var(--header-bg)', backdropFilter: 'blur(12px)'
        }}>
          <Link to="/login" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.3rem', color: 'var(--primary-color)' }}>
              Rentora
            </span>
          </Link>
          <ThemeToggle />
        </header>

        {/* Main */}
        <main style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ maxWidth: 500, width: '100%', textAlign: 'center' }}>
            <div style={{
              width: 96, height: 96, borderRadius: '50%',
              background: 'rgba(245, 158, 11, 0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.75rem'
            }}>
              <Clock size={44} color="#f59e0b" strokeWidth={1.5} />
            </div>

            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              background: 'rgba(245, 158, 11, 0.1)', borderRadius: 50,
              padding: '0.3rem 1rem', marginBottom: '1rem'
            }}>
              <span style={{ color: '#f59e0b', fontSize: '0.8rem', fontWeight: 700 }}>SESSION EXPIRED</span>
            </div>

            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              You've been signed out
            </h1>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '2rem' }}>
              For your security, Rentora automatically signs you out after a period of inactivity. Please sign in again to continue.
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={handleSignIn}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.75rem 1.75rem', borderRadius: 12,
                  background: 'var(--primary-color)', color: '#fff',
                  border: 'none', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer'
                }}
              >
                <LogIn size={16} /> Sign In Again
              </button>
              <Link
                to="/"
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.75rem 1.5rem', borderRadius: 12,
                  background: 'var(--surface-muted)', color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)', textDecoration: 'none',
                  fontWeight: 600, fontSize: '0.9rem'
                }}
              >
                <RefreshCw size={16} /> Browse Catalog
              </Link>
            </div>

            <p style={{
              marginTop: '2.5rem', fontSize: '0.82rem', color: 'var(--text-muted)'
            }}>
              Lost your access?{' '}
              <Link to="/login" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: 600 }}>
                Reset your password
              </Link>
            </p>
          </div>
        </main>

        <footer style={{
          textAlign: 'center', padding: '1.25rem',
          color: 'var(--text-muted)', fontSize: '0.82rem',
          borderTop: '1px solid var(--border-color)'
        }}>
          © {new Date().getFullYear()} Rentora Technologies Pvt. Ltd.
        </footer>
      </div>
    </>
  );
};

export default SessionExpiredPage;
