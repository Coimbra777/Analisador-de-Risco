<template>
  <form class="stack-md" @submit.prevent="handleSubmit">
    <div class="field">
      <label for="legalName">Razão social</label>
      <input
        id="legalName"
        v-model="form.legalName"
        :disabled="loading"
        placeholder="Ex.: Fornecedor Silva LTDA"
        required
        type="text"
      />
      <small class="field-help">Nome oficial da empresa no cadastro.</small>
    </div>

    <div class="field">
      <label for="tradeName">Nome fantasia</label>
      <input
        id="tradeName"
        v-model="form.tradeName"
        :disabled="loading"
        placeholder="Ex.: Silva Distribuidora"
        type="text"
      />
    </div>

    <div class="field">
      <label for="registrationNumber">Número de registro</label>
      <input
        id="registrationNumber"
        v-model="form.registrationNumber"
        :disabled="loading"
        placeholder="Ex.: 12.345.678/0001-90"
        required
        type="text"
      />
      <small class="field-help">Use o identificador principal da empresa.</small>
    </div>

    <div class="field">
      <label for="country">País</label>
      <input
        id="country"
        v-model="form.country"
        :disabled="loading"
        placeholder="Ex.: Brasil"
        type="text"
      />
    </div>

    <AppButton
      label="Salvar empresa"
      :loading="loading"
      loading-label="Salvando empresa..."
      type="submit"
    />
  </form>
</template>

<script setup lang="ts">
import { reactive } from 'vue';

import AppButton from '@/shared/ui/AppButton.vue';

defineProps<{
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
