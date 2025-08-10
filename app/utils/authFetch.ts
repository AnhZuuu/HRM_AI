// export const authFetch = async (url: string, options: RequestInit = {}) => {
//   const token = localStorage.getItem('accessToken');
//   const headers = {
//     ...options.headers,
//     Authorization: token ? `Bearer ${token}` : '',
//     'Content-Type': 'application/json',
//   };
//   return fetch(url, { ...options, headers });
// };
// app/utils/authFetch.ts
export const authFetch = async (url: string, options: RequestInit = {}) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

  const headers: HeadersInit = {
    Accept: "application/json",
    ...(options.headers || {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  // Only set Content-Type for requests that actually send JSON bodies
  const method = (options.method || "GET").toUpperCase();
  const isJsonBody = options.body && !(options.body instanceof FormData);
  if (isJsonBody && method !== "GET") {
    (headers as Record<string, string>)["Content-Type"] = "application/json";
  }

  return fetch(url, { ...options, headers });
};
