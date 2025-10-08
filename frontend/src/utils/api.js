// Utility to build backend API URLs
// Usage: import { apiUrl } from '../utils/api';
// axios.get(apiUrl('/auth/login'))
export const API_BASE = process.env.REACT_APP_API_BASE || '';

export const apiUrl = (path) => `${API_BASE}${path}`;