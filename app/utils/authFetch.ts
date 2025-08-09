export const authFetch = async (url: string, options: RequestInit = {}) => {
  const token = localStorage.getItem('accessToken');
  const headers = {
    ...options.headers,
    Authorization: token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  };
  return fetch(url, { ...options, headers });
};
