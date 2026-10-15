/**
 * fetchWithAuth
 * Wraps fetch() with automatic JWT access-token injection, multi-host network fallback,
 * and silent token refresh.
 * On full token expiry (access + refresh both invalid) it navigates to
 * /session-expired so the user sees a proper "You've been signed out" screen
 * instead of a blank login redirect.
 */
export const fetchWithAuth = async (url, options = {}) => {
  let token = localStorage.getItem('access_token');

  const buildHeaders = (t) => {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    if (t && t !== 'null' && t !== 'undefined') {
      headers['Authorization'] = `Bearer ${t}`;
    }
    return headers;
  };

  const executeFetch = async (targetUrl) => {
    try {
      return await fetch(targetUrl, {
        credentials: 'include',
        ...options,
        headers: buildHeaders(token),
      });
    } catch (netErr) {
      if (typeof targetUrl === 'string' && targetUrl.includes('localhost:8000')) {
        const fallback127 = targetUrl.replace('localhost:8000', '127.0.0.1:8000');
        try {
          return await fetch(fallback127, {
            credentials: 'include',
            ...options,
            headers: buildHeaders(token),
          });
        } catch (e2) {
          const proxyUrl = targetUrl.replace(/^http:\/\/localhost:8000/, '');
          return await fetch(proxyUrl, {
            credentials: 'include',
            ...options,
            headers: buildHeaders(token),
          });
        }
      }
      throw netErr;
    }
  };

  let response = await executeFetch(url);

  if (response.status === 401) {
    const refreshToken = localStorage.getItem('refresh_token');

    if (refreshToken) {
      try {
        let refreshRes = null;
        const refreshBody = JSON.stringify({ refresh: refreshToken });
        const refreshOpts = {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: refreshBody
        };

        try {
          refreshRes = await fetch('http://localhost:8000/api/token/refresh/', refreshOpts);
        } catch (e1) {
          try {
            refreshRes = await fetch('http://127.0.0.1:8000/api/token/refresh/', refreshOpts);
          } catch (e2) {
            refreshRes = await fetch('/api/token/refresh/', refreshOpts).catch(() => null);
          }
        }

        if (refreshRes && refreshRes.ok) {
          const data = await refreshRes.json();
          localStorage.setItem('access_token', data.access);
          if (data.refresh) localStorage.setItem('refresh_token', data.refresh);
          token = data.access;

          // Retry original request with fresh token
          response = await executeFetch(url);
        } else {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/session-expired';
        }
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/session-expired';
      }
    } else {
      localStorage.removeItem('access_token');
      window.location.href = '/session-expired';
    }
  }

  return response;
};
