// src/api/apiClient.js

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

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
