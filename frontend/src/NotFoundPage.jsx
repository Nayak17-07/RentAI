import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { FileQuestion, Home, Search, ArrowLeft } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const NotFoundPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <>
      <title>404 – Page Not Found | Rentora</title>
      <meta name="description" content="The page you're looking for doesn't exist. Browse our appliance and furniture rental catalog." />
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
          <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 700, fontSize: '1.3rem', color: 'var(--primary-color)' }}>
              Rentora
            </span>
          </Link>
          <ThemeToggle />
        </header>

        {/* Main Content */}
        <main style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem'
        }}>
          <div style={{ maxWidth: 560, width: '100%', textAlign: 'center' }}>
            {/* Animated 404 */}
            <div style={{ marginBottom: '2rem', position: 'relative', display: 'inline-block' }}>
              <div style={{
                fontSize: '9rem', fontWeight: 900, lineHeight: 1,
                fontFamily: 'Outfit, sans-serif',
                background: 'linear-gradient(135deg, var(--primary-color), #f97316)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                backgroundClip: 'text', opacity: 0.15,
                position: 'absolute', top: '50%', left: '50%',
                transform: 'translate(-50%, -50%)', userSelect: 'none'
              }}>
                404
              </div>
              <div style={{
                width: 100, height: 100, borderRadius: '50%',
                background: 'rgba(226, 55, 68, 0.08)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto'
              }}>
                <FileQuestion size={48} color="var(--primary-color)" strokeWidth={1.5} />
              </div>
            </div>

            <h1 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              Page Not Found
            </h1>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '0.5rem' }}>
              The page <code style={{
                background: 'var(--surface-muted)', padding: '0.1rem 0.4rem',
                borderRadius: 6, fontSize: '0.85em', color: 'var(--primary-color)'
              }}>{location.pathname}</code> doesn't exist.
            </p>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: '2.5rem' }}>
              It may have been moved, deleted, or you may have mistyped the URL.
            </p>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '3rem' }}>
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
              <Link
                to="/"
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.75rem 1.5rem', borderRadius: 12,
                  background: 'var(--primary-color)', color: '#fff',
                  textDecoration: 'none', fontWeight: 600, fontSize: '0.9rem'
                }}
              >
                <Home size={16} /> Browse Catalog
              </Link>
            </div>

            {/* Quick Links */}
            <div style={{
              background: 'var(--surface-color)', borderRadius: 16,
              border: '1px solid var(--border-color)', padding: '1.5rem'
            }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '1rem' }}>
                Popular Destinations
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                {[
                  { to: '/', label: '🏠 Home' },
                  { to: '/cart', label: '🛒 My Cart' },
                  { to: '/rentals', label: '📦 My Rentals' },
                  { to: '/kyc', label: '🔐 KYC Verification' },
                  { to: '/terms', label: '📄 Terms of Service' },
                  { to: '/faq', label: '❓ FAQ' },
                ].map(({ to, label }) => (
                  <Link
                    key={to}
                    to={to}
                    style={{
                      display: 'block', padding: '0.6rem 0.9rem',
                      borderRadius: 8, background: 'var(--surface-muted)',
                      color: 'var(--text-secondary)', textDecoration: 'none',
                      fontSize: '0.87rem', fontWeight: 500,
                      transition: 'all 0.15s',
                      border: '1px solid transparent'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = 'var(--primary-color)';
                      e.currentTarget.style.color = 'var(--primary-color)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'transparent';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                    }}
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer style={{
          textAlign: 'center', padding: '1.25rem',
          color: 'var(--text-muted)', fontSize: '0.82rem',
          borderTop: '1px solid var(--border-color)'
        }}>
          © {new Date().getFullYear()} Rentora Technologies Pvt. Ltd. ·{' '}
          <Link to="/contact" style={{ color: 'var(--primary-color)', textDecoration: 'none' }}>Contact Support</Link>
        </footer>
      </div>
    </>
  );
};

export default NotFoundPage;
