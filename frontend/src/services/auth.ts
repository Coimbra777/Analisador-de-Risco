import { api } from './api';
import type { AuthResponse, User } from '@/types/models';

export async function registerUser(payload: {
  name: string;
  email: string;
  password: string;
}) {
  const { data } = await api.post<User>('/auth/register', payload);

  return data;
}

export async function login(payload: { email: string; password: string }) {
  const { data } = await api.post<AuthResponse>('/auth/login', payload);

  return data;
}
