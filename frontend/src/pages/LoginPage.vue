<template>
  <div class="auth-page">
    <section class="auth-card">
      <div class="stack-sm">
        <h2>Login</h2>
        <p class="muted">Use your account to access companies, analyses and uploads.</p>
      </div>

      <p v-if="errorMessage" class="error-banner">{{ errorMessage }}</p>
      <LoginForm :loading="loading" mode="login" @submit="handleLogin" />

      <div class="divider"></div>

      <div class="stack-sm">
        <h3>Create a user</h3>
        <p class="muted">Useful for the first local run of the MVP.</p>
      </div>

      <LoginForm :loading="registering" mode="register" @submit="handleRegister" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

import LoginForm from '@/components/LoginForm.vue';
import { useAuth } from '@/composables/useAuth';
import { login, registerUser } from '@/services/auth';

const router = useRouter();
const { setSession } = useAuth();

const errorMessage = ref('');
const loading = ref(false);
const registering = ref(false);

async function handleLogin(payload: { email: string; password: string }) {
  try {
    errorMessage.value = '';
    loading.value = true;
    const response = await login(payload);
    setSession(response.accessToken, response.user);
    router.push({ name: 'companies' });
  } catch (error) {
    errorMessage.value = getErrorMessage(error, 'Unable to login.');
  } finally {
    loading.value = false;
  }
}

async function handleRegister(payload: {
  name?: string;
  email: string;
  password: string;
}) {
  try {
    errorMessage.value = '';
    registering.value = true;
    await registerUser({
      name: payload.name ?? '',
      email: payload.email,
      password: payload.password,
    });
    errorMessage.value = 'User created successfully. You can now login.';
  } catch (error) {
    errorMessage.value = getErrorMessage(error, 'Unable to create user.');
  } finally {
    registering.value = false;
  }
}

function getErrorMessage(error: unknown, fallback: string) {
  const maybeAxiosError = error as {
    response?: { data?: { message?: string | string[] } };
  };
  const message = maybeAxiosError.response?.data?.message;

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  return message ?? fallback;
}
</script>
