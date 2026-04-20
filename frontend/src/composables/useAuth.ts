import { computed, ref } from 'vue';

import type { User } from '@/types/models';

const TOKEN_KEY = 'supplier-risk-token';
const USER_KEY = 'supplier-risk-user';

const token = ref<string>(localStorage.getItem(TOKEN_KEY) ?? '');
const user = ref<User | null>(
  localStorage.getItem(USER_KEY)
    ? (JSON.parse(localStorage.getItem(USER_KEY) as string) as User)
    : null,
);

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

export function useAuth() {
  return {
    token: computed(() => token.value),
    user: computed(() => user.value),
    isAuthenticated: computed(() => Boolean(token.value)),
    setSession,
    clearSession,
  };
}
