import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ style = {}, className = '' }) {
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('rentora_theme');
      if (saved) return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  });

  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('rentora_theme', theme);

    // Broadcast change so all tabs and instances sync
    window.dispatchEvent(new CustomEvent('rentora-theme-change', { detail: { theme } }));
  }, [theme]);

  useEffect(() => {
    const handleSync = (e) => {
      if (e.detail?.theme && e.detail.theme !== theme) {
        setTheme(e.detail.theme);
      }
    };
    window.addEventListener('rentora-theme-change', handleSync);
    return () => window.removeEventListener('rentora-theme-change', handleSync);
  }, [theme]);

  const toggleTheme = (e) => {
    if (e && e.stopPropagation) e.stopPropagation();

    // Smooth global theme transition
    document.documentElement.classList.add('theme-transitioning');
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));

    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 400);
  };

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      id="navbar-theme-toggle-btn"
      onClick={toggleTheme}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`theme-toggle-btn ${className}`}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'Light' : 'Dark'} mode`}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '38px',
        height: '38px',
        borderRadius: '999px',
        border: `1.5px solid ${
          isHovered
            ? isDark
              ? '#fbbf24'
              : '#e23744'
            : isDark
            ? 'var(--border-color)'
            : '#e2e8f0'
        }`,
        background: isHovered
          ? isDark
            ? 'rgba(251, 191, 36, 0.15)'
            : 'rgba(226, 55, 68, 0.08)'
          : isDark
          ? 'var(--surface-elevated)'
          : '#f8fafc',
        color: isDark ? '#fbbf24' : '#475569',
        cursor: 'pointer',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        transform: isHovered ? 'scale(1.06)' : 'scale(1)',
        boxShadow: isHovered
          ? isDark
            ? '0 0 16px rgba(251, 191, 36, 0.35)'
            : '0 4px 12px rgba(226, 55, 68, 0.12)'
          : '0 1px 3px rgba(0, 0, 0, 0.04)',
        flexShrink: 0,
        padding: 0,
        outline: 'none',
        userSelect: 'none',
        ...style
      }}
    >
      {isDark ? (
        <Sun
          size={18}
          style={{
            transform: isHovered ? 'rotate(45deg) scale(1.08)' : 'rotate(0deg) scale(1)',
            transition: 'transform 0.3s ease',
            color: '#fbbf24'
          }}
        />
      ) : (
        <Moon
          size={18}
          style={{
            transform: isHovered ? 'rotate(-18deg) scale(1.08)' : 'rotate(0deg) scale(1)',
            transition: 'transform 0.3s ease',
            color: '#475569'
          }}
        />
      )}
    </button>
  );
}
