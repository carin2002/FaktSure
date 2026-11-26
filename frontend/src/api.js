const API_URL = 'https://faktsure-production.up.railway.app/api';

export async function apiRequest(path, options = {}) {
  const token = sessionStorage.getItem('faktsure_token');

  const headers = {
    ...(options.body instanceof FormData ? {} : {'Content-Type': 'application/json'}),
    ...(token ? {Authorization: `Bearer ${token}`} : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.detail || `Erreur API : ${response.status}`);
  }

  return data;
}

export async function login(email, password) {
  const data = await apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({email, password}),
  });

  sessionStorage.setItem('faktsure_token', data.access_token);
  return data;
}

export async function getCurrentUser() {
  return apiRequest('/auth/me');
}
