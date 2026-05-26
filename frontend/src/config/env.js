export const env = {
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  // Absolute backend origin — used for full-page redirects (Google OAuth).
  backendUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000',
  appEnv: import.meta.env.VITE_APP_ENV || 'development',
};
