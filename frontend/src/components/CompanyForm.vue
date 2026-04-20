<template>
  <form class="stack-md" @submit.prevent="handleSubmit">
    <div class="field">
      <label for="legalName">Razão social</label>
      <input id="legalName" v-model="form.legalName" required type="text" />
    </div>

    <div class="field">
      <label for="tradeName">Nome fantasia</label>
      <input id="tradeName" v-model="form.tradeName" type="text" />
    </div>

    <div class="field">
      <label for="registrationNumber">Número de registro</label>
      <input
        id="registrationNumber"
        v-model="form.registrationNumber"
        required
        type="text"
      />
    </div>

    <div class="field">
      <label for="country">País</label>
      <input id="country" v-model="form.country" type="text" />
    </div>

    <button class="button" :disabled="loading" type="submit">
      {{ loading ? 'Salvando...' : 'Criar empresa' }}
    </button>
  </form>
</template>

<script setup lang="ts">
import { reactive } from 'vue';

const props = defineProps<{
  loading: boolean;
}>();

const emit = defineEmits<{
  submit: [
    payload: {
      legalName: string;
      tradeName?: string;
      registrationNumber: string;
      country?: string;
    },
  ];
}>();

const form = reactive({
  legalName: '',
  tradeName: '',
  registrationNumber: '',
  country: '',
});

function handleSubmit() {
  emit('submit', {
    legalName: form.legalName,
    tradeName: form.tradeName || undefined,
    registrationNumber: form.registrationNumber,
    country: form.country || undefined,
  });

  form.legalName = '';
  form.tradeName = '';
  form.registrationNumber = '';
  form.country = '';
}
</script>
