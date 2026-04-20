import { apiClient } from '@/shared/http/api-client';
import type { AuthResponse, User } from '@/shared/types/models';

export async function registerUser(payload: {
  name: string;
  email: string;
  password: string;
}) {
  const { data } = await apiClient.post<User>('/auth/register', payload);

  return data;
}

export async function loginUser(payload: { email: string; password: string }) {
  const { data } = await apiClient.post<AuthResponse>('/auth/login', payload);

  return data;
}
