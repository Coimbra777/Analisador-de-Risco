<template>
  <form class="stack-md" @submit.prevent="handleSubmit">
    <div v-if="mode === 'register'" class="field">
      <label for="name">Nome</label>
      <input id="name" v-model="form.name" :disabled="loading" required type="text" />
    </div>

    <div class="field">
      <label for="email">Email</label>
      <input id="email" v-model="form.email" :disabled="loading" required type="email" />
    </div>

    <div class="field">
      <label for="password">Senha</label>
      <input
        id="password"
        v-model="form.password"
        :disabled="loading"
        required
        minlength="8"
        type="password"
      />
    </div>

    <AppButton
      :label="mode === 'login' ? 'Entrar' : 'Criar conta'"
      :loading="loading"
      :loading-label="mode === 'login' ? 'Entrando...' : 'Criando conta...'"
      type="submit"
    />
  </form>
</template>

<script setup lang="ts">
import { reactive } from 'vue';

import AppButton from '@/shared/ui/AppButton.vue';

const props = defineProps<{
  loading: boolean;
  mode: 'login' | 'register';
}>();

const emit = defineEmits<{
  submit: [payload: { name?: string; email: string; password: string }];
}>();

const form = reactive({
  name: '',
  email: '',
  password: '',
});

function handleSubmit() {
  emit('submit', {
    name: props.mode === 'register' ? form.name : undefined,
    email: form.email,
    password: form.password,
  });
}
</script>
