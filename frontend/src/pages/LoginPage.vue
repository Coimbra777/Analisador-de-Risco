<template>
  <div class="auth-page">
    <section class="auth-card">
      <div class="stack-sm">
        <h2>Entrar</h2>
        <p class="muted">Use sua conta para acessar empresas, análises e uploads.</p>
      </div>

      <p v-if="errorMessage" class="error-banner">{{ errorMessage }}</p>
      <LoginForm :loading="loading" mode="login" @submit="handleLogin" />

      <div class="divider"></div>

      <div class="stack-sm">
        <h3>Criar usuário</h3>
        <p class="muted">Útil para a primeira execução local do MVP.</p>
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
    errorMessage.value = getErrorMessage(error, 'Não foi possível entrar.');
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
    errorMessage.value = 'Usuário criado com sucesso. Agora você já pode entrar.';
  } catch (error) {
    errorMessage.value = getErrorMessage(error, 'Não foi possível criar o usuário.');
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
