/**
 * fetchWithAuth
 * Wraps fetch() with automatic JWT access-token injection and silent refresh.
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

  let response = await fetch(url, {
    ...options,
    headers: buildHeaders(token),
  });

  if (response.status === 401) {
    const refreshToken = localStorage.getItem('refresh_token');

    if (refreshToken) {
      try {
        const refreshRes = await fetch('http://localhost:8000/api/token/refresh/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: refreshToken }),
        });

        if (refreshRes.ok) {
          const data = await refreshRes.json();
          localStorage.setItem('access_token', data.access);
          if (data.refresh) localStorage.setItem('refresh_token', data.refresh);
          token = data.access;

          // Retry original request with fresh token
          response = await fetch(url, {
            ...options,
            headers: buildHeaders(token),
          });
        } else {
          // Refresh token also invalid → full session expiry
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
      // No refresh token at all
      localStorage.removeItem('access_token');
      window.location.href = '/session-expired';
    }
  }

  return response;
};
