import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    // In production, send to error tracking service
    console.error('[ErrorBoundary]', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--bg-color)',
          padding: '2rem',
          fontFamily: 'Inter, sans-serif'
        }}>
          <div style={{
            maxWidth: 520,
            width: '100%',
            textAlign: 'center',
            background: 'var(--surface-color)',
            borderRadius: 20,
            padding: '3rem 2.5rem',
            boxShadow: 'var(--card-shadow)'
          }}>
            <div style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'rgba(239, 68, 68, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem'
            }}>
              <AlertTriangle size={34} color="#ef4444" />
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.75rem' }}>
              Something went wrong
            </h1>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '2rem' }}>
              An unexpected error occurred in this section of the app. Your data is safe — try refreshing or go back home.
            </p>
            {import.meta.env?.DEV && this.state.error && (
              <pre style={{
                background: 'var(--surface-muted)',
                borderRadius: 10,
                padding: '1rem',
                fontSize: '0.72rem',
                color: '#ef4444',
                textAlign: 'left',
                overflowX: 'auto',
                marginBottom: '1.5rem',
                maxHeight: 140,
                overflowY: 'auto'
              }}>
                {this.state.error.toString()}
              </pre>
            )}
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button
                onClick={this.handleRetry}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.7rem 1.4rem', borderRadius: 10,
                  background: 'var(--primary-color)', color: '#fff',
                  border: 'none', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer'
                }}
              >
                <RefreshCw size={16} /> Try Again
              </button>
              <a
                href="/"
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.5rem',
                  padding: '0.7rem 1.4rem', borderRadius: 10,
                  background: 'var(--surface-muted)', color: 'var(--text-primary)',
                  border: '1px solid var(--border-color)', fontWeight: 600, fontSize: '0.9rem',
                  textDecoration: 'none'
                }}
              >
                <Home size={16} /> Go Home
              </a>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
