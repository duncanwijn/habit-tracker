// src/api/apiClient.js

const BASE_URL = 'http://localhost:3000';

const apiClient = {
  async get(path) {
    const token = localStorage.getItem('token');
    return fetch(`${BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  },
  async delete(path) {
    const token = localStorage.getItem('token');
    return fetch(`${BASE_URL}${path}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  },
  async post(path, body) {
    const token = localStorage.getItem('token');
    return fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
  },
  async delete(path) {
    const token = localStorage.getItem('token');
    return fetch(`${BASE_URL}${path}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  }
};

export default apiClient;
