/**
 * Central HTTP API Service for Jaagruth Website / Authority Command
 * Stores JWT in-memory (not in localStorage).
 * 8-second timeout via AbortController.
 */

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000/api/v1';
const REQUEST_TIMEOUT_MS = 8000;

let inMemoryToken = null;
let currentOfficer = null;

export const authStorage = {
  getToken: () => inMemoryToken,
  setToken: (token) => {
    inMemoryToken = token;
  },
  getOfficer: () => currentOfficer,
  setOfficer: (officer) => {
    currentOfficer = officer;
  },
  clear: () => {
    inMemoryToken = null;
    currentOfficer = null;
  }
};

export async function request(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint.startsWith('/') ? '' : '/'}${endpoint}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  if (inMemoryToken) {
    headers['Authorization'] = `Bearer ${inMemoryToken}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const isJson = res.headers.get('content-type')?.includes('application/json');
    const data = isJson ? await res.json() : await res.text();

    if (!res.ok) {
      const errMessage = data?.error?.message || data?.message || `HTTP ${res.status}: ${res.statusText}`;
      const errCode = data?.error?.code || 'API_ERROR';
      const error = new Error(errMessage);
      error.code = errCode;
      error.status = res.status;
      error.data = data;
      throw error;
    }

    return data;
  } catch (err) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      const timeoutErr = new Error('Server request timed out (8s limit exceeded).');
      timeoutErr.code = 'TIMEOUT';
      throw timeoutErr;
    }
    throw err;
  }
}

export const api = {
  get: (endpoint, options) => request(endpoint, { method: 'GET', ...options }),
  post: (endpoint, body, options) => request(endpoint, { method: 'POST', body: JSON.stringify(body), ...options }),
  put: (endpoint, body, options) => request(endpoint, { method: 'PUT', body: JSON.stringify(body), ...options }),
  patch: (endpoint, body, options) => request(endpoint, { method: 'PATCH', body: JSON.stringify(body), ...options }),
  delete: (endpoint, options) => request(endpoint, { method: 'DELETE', ...options })
};
