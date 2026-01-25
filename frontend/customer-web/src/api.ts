// frontend/admin-panel/src/api.ts
export const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};

export const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const headers = { ...getHeaders(), ...options.headers };
  const response = await fetch(url, { ...options, headers });
  if (response.status === 401) {
    // Handle unauth
    localStorage.removeItem('token');
    window.location.reload();
  }
  return response;
};
