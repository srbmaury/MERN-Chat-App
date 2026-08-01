export const API_BASE_URL = import.meta.env.VITE_API_URL || "";
export const SOCKET_URL = import.meta.env.VITE_SOCKET_URL
  || (import.meta.env.DEV ? "http://localhost:5000" : window.location.origin);
