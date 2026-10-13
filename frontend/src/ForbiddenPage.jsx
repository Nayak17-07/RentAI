import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShieldOff, Home, LogIn, ArrowLeft } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const ForbiddenPage = ({ requiredRole = 'the required role' }) => {
  const navigate = useNavigate();
  const isLoggedIn = !!localStorage.getItem('access_token');

  return (
    <>
      <title>403 – Access Denied | Rentora</title>
      <meta name="description" content="You don't have permission to access this page." />
      <meta name="robots" content="noindex" />

      <div style={{
        minHeight: '100vh',
        background: 'var(--bg-color)',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: 'Inter, sans-serif'
      }}>
        {/* Header */}
        <header style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '1rem 2rem', borderBottom: '1px solid var(--border-color)',
          background: 'var(--header-bg)', backdropFilter: 'blur(12px)'
        }}>
          <Link to="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.3rem', color: 'var(--primary-color)' }}>
              Rentora
            </span>
          </Link>
          <ThemeToggle />
        </header>

        {/* Main */}
        <main style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem'
        }}>
          <div style={{ maxWidth: 520, width: '100%', textAlign: 'center' }}>
            <div style={{
              width: 100, height: 100, borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 1.75rem'
            }}>
              <ShieldOff size={48} color="var(--primary-color)" strokeWidth={1.5} />
            </div>

            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              background: 'rgba(239, 68, 68, 0.08)', borderRadius: 50,
              padding: '0.3rem 1rem', marginBottom: '1rem'
            }}>
              <span style={{ color: 'var(--primary-color)', fontSize: '0.8rem', fontWeight: 700 }}>403 FORBIDDEN</span>
            </div>

            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              Access Denied
            </h1>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '2rem' }}>
              {isLoggedIn
                ? `You don't have permission to view this page. This area requires ${requiredRole} privileges.`
                : 'You need to be logged in to access this page. Please sign in to continue.'}
            </p>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigate(-1)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.75rem 1.5rem', borderRadius: 12,
                  background: 'var(--surface-muted)', color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)', fontWeight: 600,
                  fontSize: '0.9rem', cursor: 'pointer'
                }}
              >
                <ArrowLeft size={16} /> Go Back
              </button>

              {isLoggedIn ? (
                <Link
                  to="/"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.75rem 1.5rem', borderRadius: 12,
                    background: 'var(--primary-color)', color: '#fff',
                    textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem'
                  }}
                >
                  <Home size={16} /> Back to Home
                </Link>
              ) : (
                <Link
                  to="/login"
                  style={{
                    display: 'flex', alignItems: 'center', gap: '0.5rem',
                    padding: '0.75rem 1.5rem', borderRadius: 12,
                    background: 'var(--primary-color)', color: '#fff',
                    textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem'
                  }}
                >
                  <LogIn size={16} /> Sign In
                </Link>
              )}
            </div>
          </div>
        </main>

        <footer style={{
          textAlign: 'center', padding: '1.25rem',
          color: 'var(--text-muted)', fontSize: '0.82rem',
          borderTop: '1px solid var(--border-color)'
        }}>
          © {new Date().getFullYear()} Rentora Technologies Pvt. Ltd. ·{' '}
          <Link to="/contact" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>Need Help?</Link>
        </footer>
      </div>
    </>
  );
};

export default ForbiddenPage;
