export const fetchWithAuth = async (url, options = {}) => {
  let token = localStorage.getItem('access_token');
  
  const getHeaders = (t) => ({
    ...options.headers,
    'Authorization': `Bearer ${t}`,
    'Content-Type': 'application/json'
  });

  let response = await fetch(url, {
    ...options,
    headers: getHeaders(token)
  });

  if (response.status === 401) {
    const refreshToken = localStorage.getItem('refresh_token');
    if (refreshToken) {
      try {
        const refreshRes = await fetch('http://localhost:8000/api/token/refresh/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: refreshToken })
        });
        
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          localStorage.setItem('access_token', data.access);
          localStorage.setItem('refresh_token', data.refresh);
          token = data.access;
          
          // Retry original request
          response = await fetch(url, {
            ...options,
            headers: getHeaders(token)
          });
        } else {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          window.location.href = '/login';
        }
      } catch (e) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
      }
    } else {
      localStorage.removeItem('access_token');
      window.location.href = '/login';
    }
  }
  return response;
};
