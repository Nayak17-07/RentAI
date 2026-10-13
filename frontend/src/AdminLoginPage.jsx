import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  ArrowLeft, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Activity,
  Terminal,
  KeyRound
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';

export default function AdminLoginPage() {
  const [identifier, setIdentifier] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError('Please provide your admin username/email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:8000/api/auth/admin-login/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: identifier.trim(),
          password: password.trim()
        })
      });

      const data = await res.json();

      if (res.ok && data.access) {
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        localStorage.setItem('user_role', 'admin');
        if (data.user?.username) {
          localStorage.setItem('username', data.user.username);
        }
        localStorage.setItem('user', JSON.stringify(data.user));

        // Redirect to isolated Admin Operations Console
        navigate('/admin');
      } else {
        setError(data.error || data.detail || 'Authorization failed. Verify your staff credentials.');
      }
    } catch (err) {
      console.error('Admin login error:', err);
      setError('Unable to reach authentication gateway. Verify server status.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at top, #1e1b4b 0%, #090d16 65%, #030712 100%)',
      display: 'flex',
      flexDirection: 'column',
      color: '#f8fafc',
      fontFamily: "'Inter', sans-serif",
      position: 'relative',
      overflow: 'hidden'
    }}>
      {/* Background ambient lighting */}
      <div style={{
        position: 'absolute',
        top: '-15%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: '720px',
        height: '420px',
        background: 'radial-gradient(circle, rgba(124, 58, 237, 0.22) 0%, rgba(99, 102, 241, 0.08) 50%, transparent 80%)',
        filter: 'blur(70px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Top Header Bar */}
      <header style={{
        padding: '1.25rem 2.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        zIndex: 10,
        borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
        backdropFilter: 'blur(10px)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)',
            padding: '0.45rem',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 14px rgba(124, 58, 237, 0.4)'
          }}>
            <Activity size={20} color="white" />
          </div>
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, letterSpacing: '-0.02em', color: '#ffffff' }}>
              Rentora <span style={{ color: '#a78bfa' }}>Ops Console</span>
            </div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
              Staff & Administrative Gateway
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link
            to="/"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              color: '#cbd5e1',
              textDecoration: 'none',
              fontSize: '0.84rem',
              fontWeight: 600,
              padding: '0.45rem 0.9rem',
              borderRadius: '8px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              transition: 'all 0.15s ease'
            }}
            onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.1)'; e.currentTarget.style.color = '#ffffff'; }}
            onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)'; e.currentTarget.style.color = '#cbd5e1'; }}
          >
            <ArrowLeft size={14} />
            <span>Storefront</span>
          </Link>
          <ThemeToggle />
        </div>
      </header>

      {/* Main Login Card Container */}
      <main style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.25rem',
        position: 'relative',
        zIndex: 10
      }}>
        <div style={{
          width: '100%',
          maxWidth: '440px',
          background: 'rgba(17, 24, 39, 0.75)',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '24px',
          padding: '2.5rem 2.25rem',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.65), 0 0 40px rgba(124, 58, 237, 0.15)',
          backdropFilter: 'blur(20px)',
          animation: 'fadeIn 0.25s ease-out'
        }}>
          {/* Badge & Lock Icon */}
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <div style={{
              width: '58px',
              height: '58px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.25) 0%, rgba(99, 102, 241, 0.15) 100%)',
              border: '1.5px solid rgba(167, 139, 250, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.15rem',
              boxShadow: '0 8px 24px rgba(124, 58, 237, 0.25)'
            }}>
              <ShieldCheck size={28} color="#c084fc" />
            </div>

            <span style={{
              background: 'rgba(124, 58, 237, 0.18)',
              color: '#c084fc',
              border: '1px solid rgba(167, 139, 250, 0.3)',
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '0.2rem 0.7rem',
              borderRadius: '999px',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              display: 'inline-block',
              marginBottom: '0.65rem'
            }}>
              Internal Staff Only
            </span>

            <h1 style={{
              fontSize: '1.55rem',
              fontWeight: 800,
              color: '#ffffff',
              margin: '0 0 0.45rem',
              letterSpacing: '-0.02em'
            }}>
              Operations Console Login
            </h1>
            <p style={{
              color: '#94a3b8',
              fontSize: '0.86rem',
              lineHeight: 1.45,
              margin: 0
            }}>
              Authorized administrators manage fleet telemetry, KYC verification audits, and real-time reverse logistics.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '12px',
              padding: '0.75rem 1rem',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.65rem',
              fontSize: '0.825rem',
              color: '#fca5a5',
              lineHeight: 1.4
            }}>
              <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>{error}</div>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleAdminLogin}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#cbd5e1',
                marginBottom: '0.45rem'
              }}>
                Administrator Username / Email
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: '#64748b'
                }}>
                  <User size={16} />
                </div>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => { setIdentifier(e.target.value); setError(''); }}
                  placeholder="admin or admin@rentora.com"
                  autoFocus
                  required
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem 0.8rem 2.65rem',
                    borderRadius: '12px',
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1.5px solid rgba(255, 255, 255, 0.12)',
                    color: '#ffffff',
                    fontSize: '0.925rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'all 0.15s ease'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#a78bfa'; e.target.style.boxShadow = '0 0 0 3px rgba(167, 139, 250, 0.2)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{
                display: 'block',
                fontSize: '0.8rem',
                fontWeight: 700,
                color: '#cbd5e1',
                marginBottom: '0.45rem'
              }}>
                Master Passcode
              </label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                  color: '#64748b'
                }}>
                  <KeyRound size={16} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  placeholder="••••••••"
                  required
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem 0.8rem 2.65rem',
                    borderRadius: '12px',
                    background: 'rgba(15, 23, 42, 0.7)',
                    border: '1.5px solid rgba(255, 255, 255, 0.12)',
                    color: '#ffffff',
                    fontSize: '0.925rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                    transition: 'all 0.15s ease'
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#a78bfa'; e.target.style.boxShadow = '0 0 0 3px rgba(167, 139, 250, 0.2)'; }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(255, 255, 255, 0.12)'; e.target.style.boxShadow = 'none'; }}
                />
              </div>
            </div>

            {/* Quick Demo Pill Helper */}
            <div style={{
              background: 'rgba(124, 58, 237, 0.1)',
              border: '1px dashed rgba(167, 139, 250, 0.3)',
              borderRadius: '10px',
              padding: '0.6rem 0.85rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.78rem'
            }}>
              <span style={{ color: '#cbd5e1' }}>
                🔑 Pre-Seeded Admin: <code style={{ color: '#c084fc', fontWeight: 800 }}>admin</code> / <code style={{ color: '#c084fc', fontWeight: 800 }}>admin123</code>
              </span>
              <button
                type="button"
                onClick={() => { setIdentifier('admin'); setPassword('admin123'); setError(''); }}
                style={{
                  background: 'rgba(167, 139, 250, 0.2)',
                  border: 'none',
                  borderRadius: '6px',
                  color: '#e9d5ff',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  padding: '0.2rem 0.55rem',
                  cursor: 'pointer'
                }}
              >
                Autofill
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.85rem',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(135deg, #7c3aed 0%, #6366f1 100%)',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: '0.95rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: '0 4px 16px rgba(124, 58, 237, 0.4)',
                transition: 'all 0.15s ease'
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Authenticating Privileges...</span>
                </>
              ) : (
                <>
                  <Lock size={16} />
                  <span>Authenticate & Enter Console</span>
                </>
              )}
            </button>
          </form>

          {/* Security Disclaimer */}
          <div style={{
            marginTop: '1.5rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            textAlign: 'center',
            fontSize: '0.75rem',
            color: '#64748b'
          }}>
            🔒 This console is protected by Rentora Identity Governance. All administrative access attempts are logged for security audits.
          </div>
        </div>
      </main>
    </div>
  );
}
