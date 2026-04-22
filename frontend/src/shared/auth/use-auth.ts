import { computed, ref } from 'vue';

import type { User } from '@/shared/types/api.types';

const TOKEN_KEY = 'supplier-risk-token';
const USER_KEY = 'supplier-risk-user';

const token = ref<string>(localStorage.getItem(TOKEN_KEY) ?? '');
const user = ref<User | null>(readStoredUser());

function setSession(nextToken: string, nextUser: User) {
  token.value = nextToken;
  user.value = nextUser;
  localStorage.setItem(TOKEN_KEY, nextToken);
  localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
}

function clearSession() {
  token.value = '';
  user.value = null;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

function readStoredUser() {
  const storedUser = localStorage.getItem(USER_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as User;
  } catch {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);

    return null;
  }
}

export function useAuth() {
  return {
    token: computed(() => token.value),
    user: computed(() => user.value),
    isAuthenticated: computed(() => Boolean(token.value)),
    setSession,
    clearSession,
  };
}
