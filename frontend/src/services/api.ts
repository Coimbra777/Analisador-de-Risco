import axios from 'axios';

import { useAuth } from '@/composables/useAuth';

export const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const { token } = useAuth();

  if (token.value) {
    config.headers.Authorization = `Bearer ${token.value}`;
  }

  return config;
});
