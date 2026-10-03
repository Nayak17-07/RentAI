import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, Mail, Phone, ArrowRight, Home as HomeIcon } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

const RegisterPage = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone_num: '',
    password: '',
    role: 'customer' // 'customer' | 'owner'
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      // 1. Create Account
      const regResponse = await fetch('http://localhost:8000/api/users/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      if (!regResponse.ok) {
        const errorData = await regResponse.json();
        const firstErrorMsg = Object.values(errorData)[0];
        throw new Error(Array.isArray(firstErrorMsg) ? firstErrorMsg[0] : 'Registration failed');
      }
      
      // 2. Automatically Log In
      const loginResponse = await fetch('http://localhost:8000/api/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: formData.username, password: formData.password })
      });

      if (loginResponse.ok) {
        const data = await loginResponse.json();
        localStorage.setItem('access_token', data.access);
        localStorage.setItem('refresh_token', data.refresh);
        localStorage.setItem('user_role', data.user?.role || formData.role);
        onLogin(data.access);
        
        if (formData.role === 'owner') {
          navigate('/owner');
        } else {
          navigate('/');
        }
      } else {
        navigate('/login');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--bg-color)', position: 'relative' }}>
      <div style={{ position: 'absolute', top: '1.25rem', right: '1.5rem', zIndex: 100 }}>
        <ThemeToggle />
      </div>

      {/* Left side - Form */}
      <div style={{ flex: '1', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '2rem', background: 'var(--surface-color, white)' }}>
        <div className="animate-fade-in" style={{ width: '100%', maxWidth: '400px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', justifyContent: 'center' }}>
            <div style={{ background: 'var(--primary-color)', padding: '0.4rem', borderRadius: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <HomeIcon size={20} color="white" />
            </div>
            <h2 style={{ margin: 0, fontSize: '1.5rem', color: 'var(--primary-color)' }}>Rentora</h2>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h1 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: 'var(--secondary-color)' }}>
              Create an account
            </h1>
            <p style={{ color: 'var(--text-secondary)' }}>Join thousands of users who have upgraded their lifestyle.</p>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', borderLeft: '4px solid var(--primary-color)', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1.5rem', color: '#b91c1c', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Account Type Selector (Customer vs Owner) */}
            <div>
              <label className="input-label" style={{ marginBottom: '0.4rem', display: 'block' }}>I want to:</label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'customer' })}
                  style={{
                    padding: '0.75rem 0.5rem',
                    borderRadius: '8px',
                    border: formData.role === 'customer' ? '2px solid #e23744' : '1px solid #e2e8f0',
                    background: formData.role === 'customer' ? '#fff5f5' : '#f8fafc',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontSize: '1.25rem', marginBottom: '0.2rem' }}>👤</div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: formData.role === 'customer' ? '#e23744' : '#334155' }}>
                    Rent Appliances
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Customer / Renter</div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, role: 'owner' })}
                  style={{
                    padding: '0.75rem 0.5rem',
                    borderRadius: '8px',
                    border: formData.role === 'owner' ? '2px solid #10b981' : '1px solid #e2e8f0',
                    background: formData.role === 'owner' ? '#ecfdf5' : '#f8fafc',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{ fontSize: '1.25rem', marginBottom: '0.2rem' }}>💼</div>
                  <div style={{ fontWeight: 700, fontSize: '0.85rem', color: formData.role === 'owner' ? '#059669' : '#334155' }}>
                    List & Earn
                  </div>
                  <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Appliance Owner</div>
                </button>
              </div>
            </div>

            <div>
              <label className="input-label">Username</label>
              <div style={{ position: 'relative' }}>
                <User style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', width: '1.25rem', height: '1.25rem' }} />
                <input 
                  type="text" 
                  name="username"
                  className="input-field" 
                  placeholder="Choose a username" 
                  value={formData.username}
                  onChange={handleChange}
                  style={{ paddingLeft: '3rem' }}
                  required 
                />
              </div>
            </div>

            <div>
              <label className="input-label">Email Address</label>
              <div style={{ position: 'relative' }}>
                <Mail style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', width: '1.25rem', height: '1.25rem' }} />
                <input 
                  type="email" 
                  name="email"
                  className="input-field" 
                  placeholder="Enter your email" 
                  value={formData.email}
                  onChange={handleChange}
                  style={{ paddingLeft: '3rem' }}
                  required 
                />
              </div>
            </div>

            <div>
              <label className="input-label">Phone Number (Optional)</label>
              <div style={{ position: 'relative' }}>
                <Phone style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', width: '1.25rem', height: '1.25rem' }} />
                <input 
                  type="tel" 
                  name="phone_num"
                  className="input-field" 
                  placeholder="Enter your phone number" 
                  value={formData.phone_num}
                  onChange={handleChange}
                  style={{ paddingLeft: '3rem' }}
                />
              </div>
            </div>

            <div>
              <label className="input-label">Password</label>
              <div style={{ position: 'relative' }}>
                <Lock style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', width: '1.25rem', height: '1.25rem' }} />
                <input 
                  type="password" 
                  name="password"
                  className="input-field" 
                  placeholder="Create a strong password" 
                  value={formData.password}
                  onChange={handleChange}
                  style={{ paddingLeft: '3rem' }}
                  required 
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" disabled={isLoading} style={{ width: '100%', marginTop: '0.5rem', padding: '0.875rem' }}>
              {isLoading ? 'Creating Account...' : 'Sign Up'}
              {!isLoading && <ArrowRight size={18} />}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: '2rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
            Already have an account?{' '}
            <Link to="/login" style={{ color: 'var(--primary-color)', textDecoration: 'none', fontWeight: '600' }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>

      {/* Right side - Image */}
      <div style={{ flex: '1', display: 'none', '@media (minWidth: 768px)': { display: 'block' }, position: 'relative' }} className="auth-image-container">
        <img 
          src="https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&q=80&w=1200" 
          alt="Beautiful apartment" 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, transparent, rgba(0,0,0,0.4))' }}></div>
        <div style={{ position: 'absolute', bottom: '4rem', right: '4rem', color: 'white', maxWidth: '400px', textAlign: 'right' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: 'white' }}>Transform your space today.</h2>
          <p style={{ fontSize: '1.125rem', opacity: 0.9 }}>Flexible plans, premium quality, and zero hassle.</p>
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

export default RegisterPage;
