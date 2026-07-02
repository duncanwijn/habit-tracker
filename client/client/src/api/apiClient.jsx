// src/api/apiClient.js

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

if (!import.meta.env.VITE_API_URL && import.meta.env.PROD) {
  console.error('[apiClient] VITE_API_URL is not set. All API calls will fail in production. Set this variable in your Vercel project settings and redeploy.');
} else if (!import.meta.env.PROD) {
  console.log(`[apiClient] Using API base URL: ${BASE_URL}`);
} else if (BASE_URL === 'http://localhost:3000') {
  console.warn('[apiClient] Using default API base URL (http://localhost:3000). Make sure to set VITE_API_URL in your Vercel project settings for production.');
}
const apiClient = {
  async get(path) {
    const token = localStorage.getItem('token');
    return expiredTokenHandler(fetch(`${BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }));
  },
  async delete(path) {
    const token = localStorage.getItem('token');
    return expiredTokenHandler(fetch(`${BASE_URL}${path}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }));
  },
  async post(path, body) {
    const token = localStorage.getItem('token');
    return expiredTokenHandler(fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    }));
  },
  async delete(path) {
    const token = localStorage.getItem('token');
    return expiredTokenHandler(fetch(`${BASE_URL}${path}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    }));
  }
};

const expiredTokenHandler = async (responsePromise) => {
  const response = await responsePromise;
  if (response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
  }
  return response;
}

export default apiClient;
