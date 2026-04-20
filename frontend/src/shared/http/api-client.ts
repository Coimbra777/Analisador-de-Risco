import axios from 'axios';

import { useAuth } from '@/shared/auth/use-auth';

export const apiClient = axios.create({
  baseURL: '/api',
});

apiClient.interceptors.request.use((config) => {
  const { token } = useAuth();

  if (token.value) {
    config.headers.Authorization = `Bearer ${token.value}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const { clearSession } = useAuth();
      const currentPath =
        window.location.pathname + window.location.search + window.location.hash;

      clearSession();

      if (!window.location.pathname.startsWith('/login')) {
        const redirect = encodeURIComponent(currentPath);
        window.location.assign(`/login?reason=session-expired&redirect=${redirect}`);
      }
    }

    return Promise.reject(error);
  },
);
