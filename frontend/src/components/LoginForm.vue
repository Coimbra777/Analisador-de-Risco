<template>
  <form class="stack-md" @submit.prevent="handleSubmit">
    <div v-if="mode === 'register'" class="field">
      <label for="name">Name</label>
      <input id="name" v-model="form.name" required type="text" />
    </div>

    <div class="field">
      <label for="email">Email</label>
      <input id="email" v-model="form.email" required type="email" />
    </div>

    <div class="field">
      <label for="password">Password</label>
      <input
        id="password"
        v-model="form.password"
        required
        minlength="8"
        type="password"
      />
    </div>

    <button class="button" :disabled="loading" type="submit">
      {{ loading ? 'Please wait...' : mode === 'login' ? 'Login' : 'Create account' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { reactive } from 'vue';

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
