const API_BASE_URL = typeof window !== 'undefined' 
  ? (localStorage.getItem('api_endpoint') || 'http://localhost:8000')
  : 'http://localhost:8000';

function getHeaders() {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  // Read current endpoint on each call in case user changes it in settings
  const base = typeof window !== 'undefined' 
    ? (localStorage.getItem('api_endpoint') || 'http://localhost:8000')
    : 'http://localhost:8000';
    
  const url = `${base}${endpoint}`;
  
  const headers = getHeaders();
  if (options.body instanceof FormData) {
    delete headers['Content-Type']; // Let browser set boundary
  }
  
  const mergedHeaders = {
    ...headers,
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers: mergedHeaders,
  });

  if (!response.ok) {
    let errMsg = 'Something went wrong';
    try {
      const data = await response.json();
      errMsg = data.detail || errMsg;
    } catch (e) {
      try {
        errMsg = await response.text();
      } catch (inner) {}
    }
    throw new Error(errMsg);
  }

  return response.json();
}
