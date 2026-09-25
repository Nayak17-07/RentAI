import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Home as HomeIcon } from 'lucide-react';

const LoginPage = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await fetch('http://localhost:8000/api/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      if (!response.ok) {
        throw new Error('Invalid credentials');
      }
      
      const data = await response.json();
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      onLogin(data.access);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)' }}>
      {/* Left side - Image */}
      <div style={{ flex: '1', display: 'none', '@media (minWidth: 768px)': { display: 'block' }, position: 'relative' }} className="auth-image-container">
        <img 
          src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&q=80&w=1200" 
          alt="Beautiful interior" 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(0,0,0,0.4), transparent)' }}></div>
        <div style={{ position: 'absolute', bottom: '4rem', left: '4rem', color: 'white', maxWidth: '400px' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'white' }}>Furnish your dream home, effortlessly.</h2>
          <p style={{ fontSize: '1.125rem', opacity: 0.9 }}>Join thousands of users who have upgraded their lifestyle with RentAI.</p>
        </div>
      </div>

      {/* Right side - Form */}
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '2rem', background: 'white' }}>
        <div className="animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '3rem', justifyContent: 'center' }}>
            <div style={{ background: 'var(--primary-color)', padding: '0.4rem', borderRadius: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HomeIcon size={20} color="white" />
            </div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--primary-color)' }}>RentAI</h2>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--secondary-color)' }}>
              Welcome back
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>Sign in to manage your rentals and packages.</p>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', borderLeft: '4px solid var(--primary-color)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', color: '#b91c1c', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div>
              <label className="input-label">Username</label>
              <div style={{ position: 'relative' }}>
                <Mail style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', width: '1.25rem', height: '1.25rem' }} />
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="Enter your username" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{ paddingLeft: '3rem' }}
                  required 
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <label className="input-label">Password</label>
                <a href="#" style={{ fontSize: '0.875rem', color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '500' }}>Forgot password?</a>
              </div>
              <div style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', width: '1.25rem', height: '1.25rem' }} />
                <input 
                  type="password" 
                  className="input-field" 
                  placeholder="Enter your password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{ paddingLeft: '3rem' }}
                  required 
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={isLoading} style={{ width: '100%', marginTop: '0.5rem', padding: '0.875rem' }}>
              {isLoading ? 'Signing in...' : 'Sign In'}
              {!isLoading && <ArrowRight size={18} />}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Don't have an account?{' '}
            <Link to="/register" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '600' }}>
              Sign up
            </Link>
          </p>
        </div>
      </div>
      
      <style>{`
        @media (max-width: 768px) {
          .auth-image-container { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
