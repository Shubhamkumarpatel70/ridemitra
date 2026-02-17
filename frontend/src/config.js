// API Configuration: use VITE_API_URL if set (e.g. for build), else dev backend or '' for same-origin production
export const API_URL = import.meta.env.VITE_API_URL !== undefined
  ? import.meta.env.VITE_API_URL
  : (import.meta.env.DEV ? 'http://localhost:5000' : '');

