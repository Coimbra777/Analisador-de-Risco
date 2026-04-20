<template>
  <div class="auth-page">
    <section class="auth-card">
      <SectionHeader
        description="Acesse sua conta para cadastrar empresas, criar análises e enviar documentos."
        title="Entrar"
        title-tag="h2"
      />

      <FeedbackBanner
        v-if="feedbackMessage"
        :message="feedbackMessage"
        :variant="feedbackType"
      />
      <EmptyState
        description="Entre com sua conta e siga este caminho: criar empresa, criar análise e enviar o PDF."
        title="Primeiros passos"
      />
      <AuthForm :loading="isLoggingIn" mode="login" @submit="handleLogin" />

      <div class="divider"></div>

      <SectionHeader
        description="Crie uma conta para começar a usar o sistema."
        title="Criar usuário"
        title-tag="h3"
      />

      <AuthForm :loading="isRegistering" mode="register" @submit="handleRegister" />
    </section>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { loginUser, registerUser } from '@/features/auth/api/auth.api';
import AuthForm from '@/features/auth/components/AuthForm.vue';
import { useAuth } from '@/shared/auth/use-auth';
import EmptyState from '@/shared/ui/EmptyState.vue';
import FeedbackBanner from '@/shared/ui/FeedbackBanner.vue';
import SectionHeader from '@/shared/ui/SectionHeader.vue';
import { getApiErrorMessage } from '@/shared/utils/get-api-error-message';

const router = useRouter();
const route = useRoute();
const { setSession } = useAuth();

const feedbackMessage = ref('');
const feedbackType = ref<'success' | 'error'>('error');
const isLoggingIn = ref(false);
const isRegistering = ref(false);

initializeFeedback();

async function handleLogin(payload: { email: string; password: string }) {
  try {
    feedbackMessage.value = '';
    isLoggingIn.value = true;
    const response = await loginUser(payload);
    setSession(response.accessToken, response.user);
    await router.push(resolveNextRoute());
  } catch (error) {
    feedbackType.value = 'error';
    feedbackMessage.value = getApiErrorMessage(error, 'Não foi possível entrar.');
  } finally {
    isLoggingIn.value = false;
  }
}

async function handleRegister(payload: {
  name?: string;
  email: string;
  password: string;
}) {
  try {
    feedbackMessage.value = '';
    isRegistering.value = true;
    await registerUser({
      name: payload.name ?? '',
      email: payload.email,
      password: payload.password,
    });
    feedbackType.value = 'success';
    feedbackMessage.value = 'Usuário criado com sucesso. Agora você já pode entrar.';
  } catch (error) {
    feedbackType.value = 'error';
    feedbackMessage.value = getApiErrorMessage(
      error,
      'Não foi possível criar o usuário.',
    );
  } finally {
    isRegistering.value = false;
  }
}

function initializeFeedback() {
  if (route.query.reason === 'session-expired') {
    feedbackType.value = 'error';
    feedbackMessage.value = 'Sua sessão expirou. Entre novamente para continuar.';
  }
}

function resolveNextRoute() {
  const redirect = route.query.redirect;

  if (typeof redirect === 'string' && redirect.startsWith('/')) {
    return redirect;
  }

  return { name: 'companies' };
}
</script>
